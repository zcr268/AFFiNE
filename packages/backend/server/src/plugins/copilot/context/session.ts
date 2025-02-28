import { ContextConfig, ContextDoc, ContextList } from './types';

export class ContextSession implements AsyncDisposable {
  constructor(
    private readonly contextId: string,
    private readonly config: ContextConfig,
    private readonly dispatcher?: (config: ContextConfig) => Promise<void>
  ) {}

  get id() {
    return this.contextId;
  }

  get workspaceId() {
    return this.config.workspaceId;
  }

  listDocs(): ContextDoc[] {
    return [...this.config.docs];
  }

  listFiles() {
    return this.config.files.map(f => ({ ...f }));
  }

  get sortedList(): ContextList {
    const { docs, files } = this.config;
    return [...docs, ...files].toSorted(
      (a, b) => a.createdAt - b.createdAt
    ) as ContextList;
  }

  async addDocRecord(docId: string): Promise<ContextList> {
    if (!this.config.docs.some(f => f.id === docId)) {
      this.config.docs.push({ id: docId, createdAt: Date.now() });
      await this.save();
    }
    return this.sortedList;
  }

  async removeDocRecord(docId: string): Promise<boolean> {
    const index = this.config.docs.findIndex(f => f.id === docId);
    if (index >= 0) {
      this.config.docs.splice(index, 1);
      await this.save();
      return true;
    }
    return false;
  }

  async save() {
    await this.dispatcher?.(this.config);
  }

  async [Symbol.asyncDispose]() {
    await this.save();
  }
}
