import './action-wrapper';

import type { EditorHost } from '@blocksuite/affine/block-std';
import { ShadowlessElement } from '@blocksuite/affine/block-std';
import type { SpecBuilder } from '@blocksuite/affine/blocks';
import { WithDisposable } from '@blocksuite/affine/global/utils';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { createTextRenderer } from '../../../_common';
import { renderImages } from '../components/images';

export class ChatText extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor attachments: string[] | undefined = undefined;

  @property({ attribute: false })
  accessor text!: string;

  @property({ attribute: false })
  accessor state: 'finished' | 'generating' = 'finished';

  @property({ attribute: false })
  accessor previewSpecBuilder!: SpecBuilder;

  protected override render() {
    const { attachments, text, host } = this;
    return html`${attachments && attachments.length > 0
      ? renderImages(attachments)
      : nothing}${createTextRenderer(host, {
      customHeading: true,
      extensions: this.previewSpecBuilder.value,
    })(text, this.state)} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-text': ChatText;
  }
}
