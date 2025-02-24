import { BlockServiceWatcher } from '@blocksuite/affine/block-std';
import {
  AffineFormatBarWidget,
  AffineSlashMenuWidget,
  PageRootBlockSpec,
} from '@blocksuite/affine/blocks';
import type { ExtensionType } from '@blocksuite/affine/store';
import type { FrameworkProvider } from '@toeverything/infra';

import { buildAIPanelConfig } from '../ai-panel';
import { setupFormatBarAIEntry } from '../entries/format-bar/setup-format-bar';
import { setupSlashMenuAIEntry } from '../entries/slash-menu/setup-slash-menu';
import { setupSpaceAIEntry } from '../entries/space/setup-space';
import {
  AffineAIPanelWidget,
  aiPanelWidget,
} from '../widgets/ai-panel/ai-panel';

function getAIPageRootWatcher(framework: FrameworkProvider) {
  class AIPageRootWatcher extends BlockServiceWatcher {
    static override readonly flavour = 'affine:page';

    override mounted() {
      super.mounted();
      this.blockService.specSlots.widgetConnected.on(view => {
        if (view.component instanceof AffineAIPanelWidget) {
          view.component.style.width = '630px';
          view.component.config = buildAIPanelConfig(view.component, framework);
          setupSpaceAIEntry(view.component);
        }

        if (view.component instanceof AffineFormatBarWidget) {
          setupFormatBarAIEntry(view.component);
        }

        if (view.component instanceof AffineSlashMenuWidget) {
          setupSlashMenuAIEntry(view.component);
        }
      });
    }
  }
  return AIPageRootWatcher;
}

export function createAIPageRootBlockSpec(
  framework: FrameworkProvider
): ExtensionType[] {
  return [...PageRootBlockSpec, aiPanelWidget, getAIPageRootWatcher(framework)];
}
