import { EdgelessEditor } from './edgeless-editor';
import { PageEditor } from './page-editor';

export * from './edgeless-editor';
export * from './page-editor';

export function effects() {
  customElements.define('page-editor', PageEditor);
  customElements.define('edgeless-editor', EdgelessEditor);
}
