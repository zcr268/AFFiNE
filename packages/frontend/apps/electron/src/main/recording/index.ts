import { ShareableContent, TappableApplication } from '@affine/native';
import { Notification } from 'electron';
import {
  BehaviorSubject,
  distinctUntilChanged,
  pairwise,
  startWith,
} from 'rxjs';

import { isMacOS } from '../../shared/utils';
import { beforeAppQuit } from '../cleanup';
import { logger } from '../logger';

interface TappableAppInfo {
  rawInstance: TappableApplication;
  isRunning: boolean;
  processId: number;
  processGroupId: number;
  bundleIdentifier: string;
  name: string;
}

interface AppGroupInfo {
  processGroupId: number;
  apps: TappableAppInfo[];
  name: string;
  icon: Buffer | undefined;
  isRunning: boolean;
}

const subscribers: Subscriber[] = [];

beforeAppQuit(() => {
  subscribers.forEach(subscriber => {
    subscriber.unsubscribe();
  });
});

let shareableContent: ShareableContent | null = null;

export const applications$ = new BehaviorSubject<TappableAppInfo[]>([]);
export const appGroups$ = new BehaviorSubject<AppGroupInfo[]>([]);

if (isMacOS()) {
  // Update appGroups$ whenever applications$ changes
  subscribers.push(
    applications$.pipe(distinctUntilChanged()).subscribe(apps => {
      const appGroups: AppGroupInfo[] = [];
      apps.forEach(app => {
        let appGroup = appGroups.find(
          group => group.processGroupId === app.processGroupId
        );

        if (!appGroup) {
          const groupProcess = shareableContent?.applicationWithProcessId(
            app.processGroupId
          );
          if (!groupProcess) {
            return;
          }
          appGroup = {
            processGroupId: app.processGroupId,
            apps: [],
            name: groupProcess.name,
            // icon will be lazy loaded
            get icon() {
              try {
                return groupProcess.icon;
              } catch (error) {
                logger.error(
                  `Failed to get icon for ${groupProcess.name}`,
                  error
                );
                return undefined;
              }
            },
            get isRunning() {
              return this.apps.some(app => app.rawInstance.isRunning);
            },
          };
          appGroups.push(appGroup);
        }
        if (appGroup) {
          appGroup.apps.push(app);
        }
      });
      appGroups$.next(appGroups);
    })
  );

  subscribers.push(
    appGroups$
      .pipe(startWith([] as AppGroupInfo[]), pairwise())
      .subscribe(([previousGroups, currentGroups]) => {
        currentGroups.forEach(currentGroup => {
          const previousGroup = previousGroups.find(
            group => group.processGroupId === currentGroup.processGroupId
          );
          if (previousGroup?.isRunning !== currentGroup.isRunning) {
            console.log(
              'appgroup running changed',
              currentGroup.name,
              currentGroup.isRunning
            );
            if (currentGroup.isRunning) {
              new Notification({
                title: 'Recording Meeting',
                body: `Recording meeting with ${currentGroup.name}`,
              }).show();
            }
          }
        });
      })
  );
}

async function getAllApps(): Promise<TappableAppInfo[]> {
  if (!shareableContent) {
    return [];
  }

  const apps = shareableContent.applications().map(app => {
    try {
      return {
        rawInstance: app,
        processId: app.processId,
        processGroupId: app.processGroupId,
        bundleIdentifier: app.bundleIdentifier,
        name: app.name,
        isRunning: app.isRunning,
      };
    } catch (error) {
      logger.error('failed to get app info', error);
      return null;
    }
  });

  const filteredApps = apps.filter(
    (v): v is TappableAppInfo =>
      v !== null &&
      !v.bundleIdentifier.startsWith('com.apple') &&
      v.processId !== process.pid
  );

  return filteredApps;
}

type Subscriber = {
  unsubscribe: () => void;
};

function setupMediaListeners() {
  subscribers.push(
    ShareableContent.onApplicationListChanged(() => {
      getAllApps()
        .then(apps => {
          applications$.next(apps);
        })
        .catch(err => {
          logger.error('failed to get apps', err);
        });
    })
  );

  getAllApps()
    .then(apps => {
      applications$.next(apps);
    })
    .catch(err => {
      logger.error('failed to get apps', err);
    });

  let appStateSubscribers: Subscriber[] = [];

  subscribers.push(
    applications$.subscribe(apps => {
      appStateSubscribers.forEach(subscriber => {
        subscriber.unsubscribe();
      });
      const _appStateSubscribers: Subscriber[] = [];

      apps.forEach(app => {
        try {
          // Try to create a TappableApplication with a default audio object ID
          // In a real implementation, you would need to get the actual audio object ID
          // This is just a placeholder value that seems to work for testing
          const tappableApp = TappableApplication.fromApplication(
            app.rawInstance,
            1
          );

          if (tappableApp) {
            _appStateSubscribers.push(
              ShareableContent.onAppStateChanged(tappableApp, () => {
                setTimeout(() => {
                  const apps = applications$.getValue();
                  applications$.next(
                    apps.map(_app => {
                      if (_app.processId === app.processId) {
                        return { ..._app, isRunning: tappableApp.isRunning };
                      }
                      return _app;
                    })
                  );
                }, 10);
              })
            );
          }
        } catch (error) {
          logger.error(
            `Failed to convert app ${app.name} to TappableApplication`,
            error
          );
        }
      });

      appStateSubscribers = _appStateSubscribers;
      return () => {
        _appStateSubscribers.forEach(subscriber => {
          subscriber.unsubscribe();
        });
      };
    })
  );
}

export function getShareableContent() {
  if (!shareableContent && isMacOS()) {
    try {
      shareableContent = new ShareableContent();
      setupMediaListeners();
    } catch (error) {
      logger.error('failed to get shareable content', error);
    }
  }
  return shareableContent;
}
