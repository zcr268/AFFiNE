import { IndexedDBDocStorage, IndexedDBSyncStorage } from '@affine/nbstore/idb';
import { SqliteDocStorage, SqliteSyncStorage } from '@affine/nbstore/sqlite';
import type { StoreClient } from '@affine/nbstore/worker/client';
import { Entity } from '@toeverything/infra';

import type { ServerService } from '../../cloud';
import type { NbstoreService } from '../../storage';

export class UserDBEngine extends Entity<{
  userId: string;
}> {
  private readonly userId = this.props.userId;
  readonly client: StoreClient;

  DocStorageType =
    BUILD_CONFIG.isElectron || BUILD_CONFIG.isIOS
      ? SqliteDocStorage
      : IndexedDBDocStorage;
  SyncStorageType =
    BUILD_CONFIG.isElectron || BUILD_CONFIG.isIOS
      ? SqliteSyncStorage
      : IndexedDBSyncStorage;

  canGracefulStop() {
    // TODO(@eyhn): Implement this
    return true;
  }

  constructor(
    private readonly nbstoreService: NbstoreService,
    serverService: ServerService
  ) {
    super();

    const { store, dispose } = this.nbstoreService.openStore(
      `userspace:${serverService.server.id},${this.userId}`,
      {
        local: {
          doc: {
            name: this.DocStorageType.identifier,
            opts: {
              id: `${serverService.server.id}:` + this.userId,
              flavour: serverService.server.id,
              type: 'userspace',
            },
          },
          sync: {
            name: this.SyncStorageType.identifier,
            opts: {
              id: `${serverService.server.id}:` + this.userId,
              type: 'userspace',
              flavour: serverService.server.id,
            },
          },
        },
        remotes: {
          cloud: {
            doc: {
              name: 'CloudDocStorage',
              opts: {
                id: this.userId,
                serverBaseUrl: serverService.server.baseUrl,
                type: 'userspace',
              },
            },
          },
        },
      }
    );
    this.client = store;
    this.client.docFrontend.start();
    this.disposables.push(() => dispose());
  }
}
