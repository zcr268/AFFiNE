import { join } from 'node:path';

import {
  app,
  Menu,
  MenuItem,
  type NativeImage,
  nativeImage,
  Tray,
} from 'electron';

import { isMacOS, resourcesPath } from '../../shared/utils';
import { applicationMenuSubjects } from '../application-menu';
import { beforeAppQuit } from '../cleanup';
import { appGroups$ } from '../recording';
import { getMainWindow } from '../windows-manager';

export interface TrayMenuConfigItem {
  label: string;
  click?: () => void;
  icon?: NativeImage | string | Buffer;
  disabled?: boolean;
}

export type TrayMenuConfig = Array<TrayMenuConfigItem | 'separator'>;

// each provider has a unique key and provides a menu config (a group of menu items)
interface TrayMenuProvider {
  key: string;
  getConfig(): TrayMenuConfig;
}

function showMainWindow() {
  getMainWindow()
    .then(w => {
      w.show();
    })
    .catch(err => console.error(err));
}

class TrayState {
  tray: Tray | null = null;

  // tray's icon
  icon: NativeImage = nativeImage
    .createFromPath(join(resourcesPath, 'icons/tray-icon.png'))
    .resize({ width: 16, height: 16 });

  // tray's tooltip
  tooltip: string = 'AFFiNE';

  constructor() {
    this.icon.setTemplateImage(true);
  }

  // sorry, no idea on better naming
  getPrimaryMenuProvider(): TrayMenuProvider {
    return {
      key: 'primary',
      getConfig: () => [
        {
          label: 'Open Journal',
          icon: join(resourcesPath, 'icons/journal-today.png'),
          click: () => {
            showMainWindow();
            applicationMenuSubjects.openJournal$.next();
          },
        },
        {
          label: 'New Page',
          icon: join(resourcesPath, 'icons/doc-page.png'),
          click: () => {
            showMainWindow();
            applicationMenuSubjects.newPageAction$.next('page');
          },
        },
        {
          label: 'New Edgeless',
          icon: join(resourcesPath, 'icons/doc-edgeless.png'),
          click: () => {
            showMainWindow();
            applicationMenuSubjects.newPageAction$.next('edgeless');
          },
        },
      ],
    };
  }

  getRecordingMenuProvider(): TrayMenuProvider {
    const appGroups = appGroups$.value;
    const runningAppGroups = appGroups.filter(appGroup => appGroup.isRunning);
    return {
      key: 'recording',
      getConfig: () => [
        {
          label: 'Start Recording Meeting',
          disabled: true,
        },
        ...runningAppGroups.map(appGroup => ({
          label: appGroup.name,
          icon: appGroup.icon || undefined,
          click: () => {
            console.log(appGroup);
          },
        })),
      ],
    };
  }

  getSecondaryMenuProvider(): TrayMenuProvider {
    return {
      key: 'secondary',
      getConfig: () => [
        {
          label: 'Open AFFiNE',
          click: () => {
            getMainWindow()
              .then(w => {
                w.show();
              })
              .catch(err => {
                console.error(err);
              });
          },
        },
        'separator',
        {
          label: 'Quit AFFiNE Completely...',
          click: () => {
            app.quit();
          },
        },
      ],
    };
  }

  buildMenu(providers: TrayMenuProvider[]) {
    const menu = new Menu();
    providers.forEach((provider, index) => {
      provider.getConfig().forEach(item => {
        if (item === 'separator') {
          menu.append(new MenuItem({ type: 'separator' }));
        } else {
          const { icon, disabled, ...rest } = item;
          let nativeIcon: NativeImage | undefined;
          if (typeof icon === 'string') {
            nativeIcon = nativeImage.createFromPath(icon);
          } else if (Buffer.isBuffer(icon)) {
            try {
              nativeIcon = nativeImage.createFromBuffer(icon);
            } catch (error) {
              console.error('Failed to create icon from buffer', error);
            }
          }
          if (nativeIcon) {
            nativeIcon = nativeIcon.resize({ width: 20, height: 20 });
          }
          menu.append(
            new MenuItem({
              ...rest,
              enabled: !disabled,
              icon: nativeIcon,
            })
          );
        }
      });
      if (index !== providers.length - 1) {
        menu.append(new MenuItem({ type: 'separator' }));
      }
    });
    return menu;
  }

  update() {
    if (!this.tray) {
      this.tray = new Tray(this.icon);
      this.tray.setToolTip(this.tooltip);
      const clickHandler = () => {
        this.update();
        if (!isMacOS()) {
          this.tray?.popUpContextMenu();
        }
      };
      this.tray.on('click', clickHandler);
      beforeAppQuit(() => {
        this.tray?.off('click', clickHandler);
        this.tray?.destroy();
      });
    }

    const providers = [
      this.getPrimaryMenuProvider(),
      isMacOS() ? this.getRecordingMenuProvider() : null,
      this.getSecondaryMenuProvider(),
    ].filter(p => p !== null);

    const menu = this.buildMenu(providers);
    this.tray.setContextMenu(menu);
  }

  init() {
    this.update();
  }
}

let _trayState: TrayState | undefined;

export const getTrayState = () => {
  if (!_trayState) {
    _trayState = new TrayState();
    _trayState.init();
  }
  return _trayState;
};
