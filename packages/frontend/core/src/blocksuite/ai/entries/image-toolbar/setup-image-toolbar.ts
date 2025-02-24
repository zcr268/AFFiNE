import '../../components/ask-ai-button';

import {
  type AffineImageToolbarWidget,
  ImageSelection,
} from '@blocksuite/affine/blocks';
import { html } from 'lit';

import { buildAIImageItemGroups } from '../../_common/config';
import type { AskAIButtonOptions } from '../../components/ask-ai-button';

const AIImageItemGroups = buildAIImageItemGroups();
const buttonOptions: AskAIButtonOptions = {
  size: 'small',
  backgroundColor: 'var(--affine-white)',
  panelWidth: 300,
};

export function setupImageToolbarAIEntry(
  imageToolbar: AffineImageToolbarWidget
) {
  imageToolbar.addPrimaryItems(
    [
      {
        type: 'ask-ai',
        when: ({ doc }) => !doc.readonly,
        generate: ({ host, blockComponent }) => {
          return {
            action: () => {
              const { selection } = host;
              selection.setGroup('note', [
                selection.create(ImageSelection, {
                  blockId: blockComponent.blockId,
                }),
              ]);
            },
            render: item =>
              html`<ask-ai-button
                class="image-toolbar-button ask-ai"
                .host=${host}
                .actionGroups=${AIImageItemGroups}
                .toggleType=${'click'}
                .options=${buttonOptions}
                @click=${(e: MouseEvent) => {
                  e.stopPropagation();
                  item.action();
                }}
              ></ask-ai-button>`,
          };
        },
      },
    ],
    0
  );
}
