import { Injectable } from '@nestjs/common';

import { OnEvent } from '../../base';
import { DocReader } from './reader';

@Injectable()
export class DocEventsListener {
  constructor(private readonly doc: DocReader) {}

  @OnEvent('doc.snapshot.updated')
  async markDocContentCacheStale({
    workspaceId,
    docId,
  }: Events['doc.snapshot.updated']) {
    await this.doc.markDocContentCacheStale(workspaceId, docId);
  }
}
