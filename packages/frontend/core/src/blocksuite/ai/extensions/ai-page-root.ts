import { LifeCycleWatcher } from '@blocksuite/affine/block-std';
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
  class AIPageRootWatcher extends LifeCycleWatcher {
    static override key = 'ai-page-root-watcher';

    override mounted() {
      super.mounted();
      const { view } = this.std;
      view.viewUpdated.on(payload => {
        if (payload.type !== 'widget' || payload.method !== 'add') {
          return;
        }
        const component = payload.view;
        if (component instanceof AffineAIPanelWidget) {
          component.style.width = '630px';
          component.config = buildAIPanelConfig(component, framework);
          setupSpaceAIEntry(component);
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
  return AIPageRootWatcher;
}

export function createAIPageRootBlockSpec(
  framework: FrameworkProvider
): ExtensionType[] {
  return [...PageRootBlockSpec, aiPanelWidget, getAIPageRootWatcher(framework)];
}
