import {
  type EditorHost,
  ShadowlessElement,
} from '@blocksuite/affine/block-std';
import { createLitPortal } from '@blocksuite/affine/blocks';
import { WithDisposable } from '@blocksuite/affine/global/utils';
import { PlusIcon } from '@blocksuite/icons/lit';
import { flip, offset } from '@floating-ui/dom';
import { css, html, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { AIProvider } from '../provider';
import type { DocDisplayConfig, DocSearchMenuConfig } from './chat-config';
import type {
  ChatChip,
  ChatContextValue,
  DocChip,
  FileChip,
} from './chat-context';
import {
  estimateTokenCount,
  getChipKey,
  isDocChip,
  isFileChip,
} from './components/utils';

// 100k tokens limit for the docs context
const MAX_TOKEN_COUNT = 100000;

export class ChatPanelChips extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .chips-wrapper {
      display: flex;
      flex-wrap: wrap;
    }
    .add-button,
    .collapse-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
      margin: 4px 0;
      box-sizing: border-box;
      cursor: pointer;
      font-size: 12px;
    }
    .add-button:hover,
    .collapse-button:hover {
      background-color: var(--affine-hover-color);
    }
  `;

  private _abortController: AbortController | null = null;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor chatContextValue!: ChatContextValue;

  @property({ attribute: false })
  accessor getContextId!: () => Promise<string | undefined>;

  @property({ attribute: false })
  accessor updateContext!: (context: Partial<ChatContextValue>) => void;

  @property({ attribute: false })
  accessor docDisplayConfig!: DocDisplayConfig;

  @property({ attribute: false })
  accessor docSearchMenuConfig!: DocSearchMenuConfig;

  @query('.add-button')
  accessor addButton!: HTMLDivElement;

  @state()
  accessor isCollapsed = false;

  override render() {
    const isCollapsed =
      this.isCollapsed &&
      this.chatContextValue.chips.filter(c => c.state !== 'candidate').length >
        1;

    const chips = isCollapsed
      ? this.chatContextValue.chips.slice(0, 1)
      : this.chatContextValue.chips;

    return html` <div class="chips-wrapper">
      <div class="add-button" @click=${this._toggleAddDocMenu}>
        ${PlusIcon()}
      </div>
      ${repeat(
        chips,
        chip => getChipKey(chip),
        chip => {
          if (isDocChip(chip)) {
            return html`<chat-panel-doc-chip
              .chip=${chip}
              .addChip=${this._addChip}
              .updateChip=${this._updateChip}
              .removeChip=${this._removeChip}
              .checkTokenLimit=${this._checkTokenLimit}
              .docDisplayConfig=${this.docDisplayConfig}
              .host=${this.host}
            ></chat-panel-doc-chip>`;
          }
          if (isFileChip(chip)) {
            return html`<chat-panel-file-chip
              .chip=${chip}
            ></chat-panel-file-chip>`;
          }
          return null;
        }
      )}
      ${isCollapsed
        ? html`<div class="collapse-button" @click=${this._toggleCollapse}>
            +${this.chatContextValue.chips.length - 1}
          </div>`
        : nothing}
    </div>`;
  }

  protected override updated(_changedProperties: PropertyValues): void {
    if (
      _changedProperties.has('chatContextValue') &&
      _changedProperties.get('chatContextValue')?.status === 'loading' &&
      this.isCollapsed === false
    ) {
      this.isCollapsed = true;
    }
  }

  private readonly _toggleCollapse = () => {
    this.isCollapsed = !this.isCollapsed;
  };

  private readonly _toggleAddDocMenu = () => {
    if (this._abortController) {
      this._abortController.abort();
      return;
    }

    this._abortController = new AbortController();
    this._abortController.signal.addEventListener('abort', () => {
      this._abortController = null;
    });

    createLitPortal({
      template: html`
        <chat-panel-add-popover
          .addChip=${this._addChip}
          .docSearchMenuConfig=${this.docSearchMenuConfig}
          .abortController=${this._abortController}
        ></chat-panel-add-popover>
      `,
      portalStyles: {
        zIndex: 'var(--affine-z-index-popover)',
      },
      container: document.body,
      computePosition: {
        referenceElement: this.addButton,
        placement: 'top-start',
        middleware: [offset({ crossAxis: -30, mainAxis: 10 }), flip()],
        autoUpdate: { animationFrame: true },
      },
      abortController: this._abortController,
      closeOnClickAway: true,
    });
  };

  private readonly _addChip = async (chip: ChatChip) => {
    if (
      this.chatContextValue.chips.length === 1 &&
      this.chatContextValue.chips[0].state === 'candidate'
    ) {
      await this._addToContext(chip);
      this.updateContext({
        chips: [chip],
      });
      return;
    }
    // remove the chip if it already exists
    const chips = this.chatContextValue.chips.filter(item => {
      if (isDocChip(chip)) {
        return !isDocChip(item) || item.docId !== chip.docId;
      } else {
        return !isFileChip(item) || item.fileId !== chip.fileId;
      }
    });
    if (chips.length < this.chatContextValue.chips.length) {
      await this._removeFromContext(chip);
    }
    await this._addToContext(chip);
    this.updateContext({
      chips: [...chips, chip],
    });
  };

  private readonly _updateChip = (
    chip: ChatChip,
    options: Partial<DocChip | FileChip>
  ) => {
    const index = this.chatContextValue.chips.findIndex(item => {
      if (isDocChip(chip)) {
        return isDocChip(item) && item.docId === chip.docId;
      } else {
        return isFileChip(item) && item.fileId === chip.fileId;
      }
    });
    const nextChip: ChatChip = {
      ...chip,
      ...options,
    };
    this.updateContext({
      chips: [
        ...this.chatContextValue.chips.slice(0, index),
        nextChip,
        ...this.chatContextValue.chips.slice(index + 1),
      ],
    });
  };

  private readonly _removeChip = async (chip: ChatChip) => {
    if (isDocChip(chip)) {
      await this._removeFromContext(chip);
      this.updateContext({
        chips: this.chatContextValue.chips.filter(item => {
          return !isDocChip(item) || item.docId !== chip.docId;
        }),
      });
    } else {
      await this._removeFromContext(chip);
      this.updateContext({
        chips: this.chatContextValue.chips.filter(item => {
          return !isFileChip(item) || item.fileId !== chip.fileId;
        }),
      });
    }
  };

  private readonly _addToContext = async (chip: ChatChip) => {
    const contextId = await this.getContextId();
    if (!contextId || !AIProvider.context) {
      return;
    }
    if (isDocChip(chip)) {
      await AIProvider.context.addContextDoc({
        contextId,
        docId: chip.docId,
      });
    } else {
      await AIProvider.context.addContextFile({
        contextId,
        fileId: chip.fileId,
      });
    }
  };

  private readonly _removeFromContext = async (chip: ChatChip) => {
    const contextId = await this.getContextId();
    if (!contextId || !AIProvider.context) {
      return;
    }
    if (isDocChip(chip)) {
      await AIProvider.context.removeContextDoc({
        contextId,
        docId: chip.docId,
      });
    } else {
      await AIProvider.context.removeContextFile({
        contextId,
        fileId: chip.fileId,
      });
    }
  };

  private readonly _checkTokenLimit = (
    newChip: DocChip,
    newTokenCount: number
  ) => {
    const estimatedTokens = this.chatContextValue.chips.reduce((acc, chip) => {
      if (isFileChip(chip)) {
        return acc;
      }
      if (chip.docId === newChip.docId) {
        return acc + newTokenCount;
      }
      if (chip.markdown?.value && chip.state === 'success') {
        const tokenCount =
          chip.tokenCount ?? estimateTokenCount(chip.markdown.value);
        return acc + tokenCount;
      }
      return acc;
    }, 0);
    return estimatedTokens <= MAX_TOKEN_COUNT;
  };
}
