import { LifeCycleWatcher } from '@blocksuite/affine/block-std';
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
  class AIEdgelessRootWatcher extends LifeCycleWatcher {
    static override key = 'ai-edgeless-root-watcher';

    override mounted() {
      super.mounted();
      const { view } = this.std;
      view.viewUpdated.on(payload => {
        if (payload.type !== 'widget' || payload.method !== 'add') {
          return;
        }
        const component = payload.view;
        if (component instanceof AffineAIPanelWidget) {
          component.style.width = '430px';
          component.config = buildAIPanelConfig(component, framework);
          setupSpaceAIEntry(component);
        }

        if (component instanceof EdgelessCopilotWidget) {
          setupEdgelessCopilot(component);
        }

        if (component instanceof EdgelessElementToolbarWidget) {
          setupEdgelessElementToolbarAIEntry(component);
        }

        if (component instanceof AffineFormatBarWidget) {
          setupFormatBarAIEntry(component);
        }

        if (component instanceof AffineSlashMenuWidget) {
          setupSlashMenuAIEntry(component);
        }
      });
    }
  }
  return AIEdgelessRootWatcher;
}
