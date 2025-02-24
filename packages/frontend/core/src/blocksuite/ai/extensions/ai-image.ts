import { BlockServiceWatcher } from '@blocksuite/affine/block-std';
import {
  AffineImageToolbarWidget,
  ImageBlockSpec,
} from '@blocksuite/affine/blocks';
import type { ExtensionType } from '@blocksuite/affine/store';

import { setupImageToolbarAIEntry } from '../entries/image-toolbar/setup-image-toolbar';

class AIImageBlockWatcher extends BlockServiceWatcher {
  static override readonly flavour = 'affine:image';

  override mounted() {
    super.mounted();
    this.blockService.specSlots.widgetConnected.on(view => {
      if (view.component instanceof AffineImageToolbarWidget) {
        setupImageToolbarAIEntry(view.component);
      }
    });
  }
}

export const AIImageBlockSpec: ExtensionType[] = [
  ...ImageBlockSpec,
  AIImageBlockWatcher,
];
