import { BlockServiceWatcher } from '@blocksuite/affine/block-std';
import {
  AffineFormatBarWidget,
  AffineSlashMenuWidget,
  EdgelessElementToolbarWidget,
  EdgelessRootBlockSpec,
} from '@blocksuite/affine/blocks';
import type { ExtensionType } from '@blocksuite/affine/store';
import type { FrameworkProvider } from '@toeverything/infra';

import { buildAIPanelConfig } from '../ai-panel';
import {
  setupEdgelessCopilot,
  setupEdgelessElementToolbarAIEntry,
} from '../entries/edgeless/index';
import { setupFormatBarAIEntry } from '../entries/format-bar/setup-format-bar';
import { setupSlashMenuAIEntry } from '../entries/slash-menu/setup-slash-menu';
import { setupSpaceAIEntry } from '../entries/space/setup-space';
import { CopilotTool } from '../tool/copilot-tool';
import {
  AffineAIPanelWidget,
  aiPanelWidget,
} from '../widgets/ai-panel/ai-panel';
import {
  EdgelessCopilotWidget,
  edgelessCopilotWidget,
} from '../widgets/edgeless-copilot';

export function createAIEdgelessRootBlockSpec(
  framework: FrameworkProvider
): ExtensionType[] {
  return [
    ...EdgelessRootBlockSpec,
    CopilotTool,
    aiPanelWidget,
    edgelessCopilotWidget,
    getAIEdgelessRootWatcher(framework),
  ];
}

function getAIEdgelessRootWatcher(framework: FrameworkProvider) {
  class AIEdgelessRootWatcher extends BlockServiceWatcher {
    static override readonly flavour = 'affine:page';

    override mounted() {
      super.mounted();
      this.blockService.specSlots.widgetConnected.on(view => {
        if (view.component instanceof AffineAIPanelWidget) {
          view.component.style.width = '430px';
          view.component.config = buildAIPanelConfig(view.component, framework);
          setupSpaceAIEntry(view.component);
        }

        if (view.component instanceof EdgelessCopilotWidget) {
          setupEdgelessCopilot(view.component);
        }

        if (view.component instanceof EdgelessElementToolbarWidget) {
          setupEdgelessElementToolbarAIEntry(view.component);
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
  return AIEdgelessRootWatcher;
}
