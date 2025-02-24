import type { EditorHost } from '@blocksuite/affine/block-std';
import { on, scrollbarStyle, stopPropagation } from '@blocksuite/affine/blocks';
import { WithDisposable } from '@blocksuite/affine/global/utils';
import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import type { AIItemGroupConfig } from '../../components/ai-item/types';

export class EdgelessCopilotPanel extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      position: absolute;
    }

    .edgeless-copilot-panel {
      box-sizing: border-box;
      padding: 8px 4px 8px 8px;
      min-width: 330px;
      max-height: 374px;
      overflow-y: auto;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
      z-index: var(--affine-z-index-popover);
    }

    ${scrollbarStyle('.edgeless-copilot-panel')}
    .edgeless-copilot-panel:hover::-webkit-scrollbar-thumb {
      background-color: var(--affine-black-30);
    }
  `;

  private _getChain() {
    return this.host.std.command.chain();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._disposables.add(on(this, 'wheel', stopPropagation));
    this._disposables.add(on(this, 'pointerdown', stopPropagation));
  }

  hide() {
    this.remove();
  }

  override render() {
    const chain = this._getChain();
    const groups = this.groups.reduce((pre, group) => {
      const filtered = group.items.filter(item =>
        item.showWhen?.(chain, 'edgeless', this.host)
      );

      if (filtered.length > 0) pre.push({ ...group, items: filtered });

      return pre;
    }, [] as AIItemGroupConfig[]);

    if (groups.every(group => group.items.length === 0)) return nothing;

    return html`
      <div class="edgeless-copilot-panel">
        <ai-item-list
          .onClick=${() => {
            this.onClick?.();
          }}
          .host=${this.host}
          .groups=${groups}
        ></ai-item-list>
      </div>
    `;
  }

  @property({ attribute: false })
  accessor entry: 'toolbar' | 'selection' | undefined = undefined;

  @property({ attribute: false })
  accessor groups!: AIItemGroupConfig[];

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor onClick: (() => void) | undefined = undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-copilot-panel': EdgelessCopilotPanel;
  }
}
