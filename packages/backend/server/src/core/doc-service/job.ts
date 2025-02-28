import { Injectable } from '@nestjs/common';

import { OnJob } from '../../base';
import { PgWorkspaceDocStorageAdapter } from '../doc';

declare global {
  interface Jobs {
    'doc.mergePendingDocUpdates': {
      workspaceId: string;
      docId: string;
    };
  }
}

@Injectable()
export class DocServiceCronJob {
  constructor(private readonly workspace: PgWorkspaceDocStorageAdapter) {}

  @OnJob('doc.mergePendingDocUpdates')
  async mergePendingDocUpdates({
    workspaceId,
    docId,
  }: Jobs['doc.mergePendingDocUpdates']) {
    await this.workspace.getDoc(workspaceId, docId);
  }
}
