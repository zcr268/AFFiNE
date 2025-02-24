import { BlockServiceWatcher } from '@blocksuite/affine/block-std';
import {
  AffineCodeToolbarWidget,
  CodeBlockSpec,
} from '@blocksuite/affine/blocks';
import type { ExtensionType } from '@blocksuite/affine/store';

import { setupCodeToolbarAIEntry } from '../entries/code-toolbar/setup-code-toolbar';

class AICodeBlockWatcher extends BlockServiceWatcher {
  static override readonly flavour = 'affine:code';

  override mounted() {
    super.mounted();
    const service = this.blockService;
    service.specSlots.widgetConnected.on(view => {
      if (view.component instanceof AffineCodeToolbarWidget) {
        setupCodeToolbarAIEntry(view.component);
      }
    });
  }
}

export const AICodeBlockSpec: ExtensionType[] = [
  ...CodeBlockSpec,
  AICodeBlockWatcher,
];
