import { LifeCycleWatcher } from '@blocksuite/affine/block-std';
import {
  AffineCodeToolbarWidget,
  CodeBlockSpec,
} from '@blocksuite/affine/blocks';
import type { ExtensionType } from '@blocksuite/affine/store';

import { setupCodeToolbarAIEntry } from '../entries/code-toolbar/setup-code-toolbar';

class AICodeBlockWatcher extends LifeCycleWatcher {
  static override key = 'ai-code-block-watcher';

  override mounted() {
    super.mounted();
    const { view } = this.std;
    view.viewUpdated.on(payload => {
      if (payload.type !== 'widget' || payload.method !== 'add') {
        return;
      }
      const component = payload.view;
      if (component instanceof AffineCodeToolbarWidget) {
        setupCodeToolbarAIEntry(component);
      }
    });
  }
}

export const AICodeBlockSpec: ExtensionType[] = [
  ...CodeBlockSpec,
  AICodeBlockWatcher,
];
