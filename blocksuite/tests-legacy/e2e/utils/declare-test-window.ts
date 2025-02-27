import type { EditorHost } from '@blocksuite/block-std';
import type { TestAffineEditorContainer } from '@blocksuite/integration-test';
import type { Store, Transformer, Workspace } from '@blocksuite/store';

declare global {
  interface Window {
    /** Available on playground window
     * the following instance are initialized in `packages/playground/apps/starter/main.ts`
     */
    $blocksuite: {
      store: typeof import('@blocksuite/store');
      blocks: typeof import('@blocksuite/blocks');
      global: {
        utils: typeof import('@blocksuite/global/utils');
      };
      editor: typeof import('@blocksuite/integration-test');
      blockStd: typeof import('@blocksuite/block-std');
    };
    collection: Workspace;
    doc: Store;
    editor: TestAffineEditorContainer;
    host: EditorHost;
    job: Transformer;
  }
}
