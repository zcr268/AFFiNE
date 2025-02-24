import type { EditorHost } from '@blocksuite/affine/block-std';
import { openFileOrFiles, unsafeCSSVarV2 } from '@blocksuite/affine/blocks';
import { SignalWatcher } from '@blocksuite/affine/global/utils';
import { ImageIcon, PublishIcon } from '@blocksuite/icons/lit';
import { css, html, LitElement, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { ChatAbortIcon, ChatClearIcon, ChatSendIcon } from '../_common/icons';
import type { ChatMessage } from '../blocks';
import type { AINetworkSearchConfig } from '../chat-panel/chat-config';
import {
  PROMPT_NAME_AFFINE_AI,
  PROMPT_NAME_NETWORK_SEARCH,
} from '../chat-panel/const';
import type { AIError } from '../components/ai-item/types';
import { AIProvider } from '../provider';
import { reportResponse } from '../utils/action-reporter';
import { readBlobAsURL } from '../utils/image';
import { stopPropagation } from '../utils/selection-utils';
import type { ChatContext } from './types';

const MaximumImageCount = 8;

export class ChatBlockInput extends SignalWatcher(LitElement) {
  static override styles = css`
    :host {
      width: 100%;
    }
    .ai-chat-input {
      display: flex;
      width: 100%;
      min-height: 100px;
      max-height: 206px;
      padding: 8px 12px;
      box-sizing: border-box;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
      position: relative;
      background-color: var(--affine-white-10);
    }
    .ai-chat-input {
      textarea {
        width: 100%;
        padding: 0;
        margin: 0;
        border: none;
        line-height: 22px;
        font-size: var(--affine-font-sm);
        font-weight: 400;
        font-family: var(--affine-font-family);
        color: var(--affine-text-primary-color);
        box-sizing: border-box;
        resize: none;
        overflow-y: hidden;
        background-color: transparent;
        user-select: none;
      }
      textarea::placeholder {
        font-size: 14px;
        font-weight: 400;
        font-family: var(--affine-font-family);
        color: var(--affine-placeholder-color);
      }
      textarea:focus {
        outline: none;
      }
    }

    .chat-panel-send svg rect {
      fill: var(--affine-primary-color);
    }
    .chat-panel-send[aria-disabled='true'] {
      cursor: not-allowed;
    }
    .chat-panel-send[aria-disabled='true'] svg rect {
      fill: var(--affine-text-disable-color);
    }

    .chat-panel-input-actions {
      display: flex;
      gap: 8px;
      align-items: center;

      div {
        width: 24px;
        height: 24px;
        cursor: pointer;
      }
      div:nth-child(2) {
        margin-left: auto;
      }

      .image-upload,
      .chat-network-search {
        display: flex;
        justify-content: center;
        align-items: center;
        svg {
          width: 20px;
          height: 20px;
          color: ${unsafeCSSVarV2('icon/primary')};
        }
      }
      .chat-network-search[data-active='true'] svg {
        color: ${unsafeCSSVarV2('icon/activated')};
      }

      .chat-network-search[aria-disabled='true'] {
        cursor: not-allowed;
      }
      .chat-network-search[aria-disabled='true'] svg {
        color: var(--affine-text-disable-color) !important;
      }
    }

    .chat-history-clear.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  `;

  override render() {
    const { images, status, messages } = this.chatContext;
    const hasImages = images.length > 0;
    const maxHeight = hasImages ? 272 + 2 : 200 + 2;
    const disableCleanUp =
      status === 'loading' || status === 'transmitting' || !messages.length;
    const cleanButtonClasses = classMap({
      'chat-history-clear': true,
      disabled: disableCleanUp,
    });

    return html`<style>
        .chat-panel-input {
          border-color: ${this._focused
            ? 'var(--affine-primary-color)'
            : 'var(--affine-border-color)'};
          box-shadow: ${this._focused ? 'var(--affine-active-shadow)' : 'none'};
          max-height: ${maxHeight}px;
          user-select: none;
        }
      </style>
      <div class="ai-chat-input">
        ${hasImages
          ? html`<image-preview-grid
              .images=${images}
              .onImageRemove=${this._handleImageRemove}
            ></image-preview-grid>`
          : nothing}
        <textarea
          rows="1"
          placeholder="What are your thoughts?"
          @keydown=${this._handleKeyDown}
          @input=${this._handleInput}
          @focus=${() => {
            this._focused = true;
          }}
          @blur=${() => {
            this._focused = false;
          }}
          @paste=${this._handlePaste}
          data-testid="chat-block-input"
        ></textarea>
        <div class="chat-panel-input-actions">
          <div class=${cleanButtonClasses} @click=${this._handleCleanup}>
            ${ChatClearIcon}
          </div>
          ${this.networkSearchConfig.visible.value
            ? html`
                <div
                  class="chat-network-search"
                  data-testid="chat-network-search"
                  aria-disabled=${this._isNetworkDisabled}
                  data-active=${this._isNetworkActive}
                  @click=${this._isNetworkDisabled
                    ? undefined
                    : this._toggleNetworkSearch}
                  @pointerdown=${stopPropagation}
                >
                  ${PublishIcon()}
                </div>
              `
            : nothing}
          ${images.length < MaximumImageCount
            ? html`<div class="image-upload" @click=${this._handleImageUpload}>
                ${ImageIcon()}
              </div>`
            : nothing}
          ${status === 'transmitting'
            ? html`<div @click=${this._handleAbort}>${ChatAbortIcon}</div>`
            : html`<div
                @click=${this._onTextareaSend}
                class="chat-panel-send"
                aria-disabled=${this._isInputEmpty}
              >
                ${ChatSendIcon}
              </div>`}
        </div>
      </div>`;
  }

  @property({ attribute: false })
  accessor parentSessionId!: string;

  @property({ attribute: false })
  accessor latestMessageId!: string;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor networkSearchConfig!: AINetworkSearchConfig;

  @property({ attribute: false })
  accessor updateChatBlock!: () => Promise<void>;

  @property({ attribute: false })
  accessor createChatBlock!: () => Promise<void>;

  @property({ attribute: false })
  accessor cleanupHistories!: () => Promise<void>;

  @property({ attribute: false })
  accessor updateContext!: (context: Partial<ChatContext>) => void;

  @property({ attribute: false })
  accessor chatContext!: ChatContext;

  @query('textarea')
  accessor textarea!: HTMLTextAreaElement;

  @state()
  accessor _isInputEmpty = true;

  @state()
  accessor _focused = false;

  private _lastPromptName: string | null = null;

  private get _isNetworkActive() {
    return (
      !!this.networkSearchConfig.visible.value &&
      !!this.networkSearchConfig.enabled.value
    );
  }

  private get _isNetworkDisabled() {
    return !!this.chatContext.images.length;
  }

  private _getPromptName() {
    if (this._isNetworkDisabled) {
      return PROMPT_NAME_AFFINE_AI;
    }
    return this._isNetworkActive
      ? PROMPT_NAME_NETWORK_SEARCH
      : PROMPT_NAME_AFFINE_AI;
  }

  private async _updatePromptName(promptName: string) {
    if (this._lastPromptName !== promptName) {
      const { currentSessionId } = this.chatContext;
      if (currentSessionId && AIProvider.session) {
        await AIProvider.session.updateSession(currentSessionId, promptName);
        this._lastPromptName = promptName;
      }
    }
  }

  private readonly _addImages = (images: File[]) => {
    const oldImages = this.chatContext.images;
    this.updateContext({
      images: [...oldImages, ...images].slice(0, MaximumImageCount),
    });
  };

  private readonly _toggleNetworkSearch = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const enable = this.networkSearchConfig.enabled.value;
    this.networkSearchConfig.setEnabled(!enable);
  };

  private readonly _handleKeyDown = async (evt: KeyboardEvent) => {
    if (evt.key === 'Enter' && !evt.shiftKey && !evt.isComposing) {
      evt.preventDefault();
      await this._onTextareaSend(evt);
    }
  };

  private readonly _handleInput = () => {
    const { textarea } = this;
    this._isInputEmpty = !textarea.value.trim();
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    if (this.scrollHeight >= 202) {
      textarea.style.height = '168px';
      textarea.style.overflowY = 'scroll';
    }
  };

  private readonly _handlePaste = (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const index in items) {
      const item = items[index];
      if (item.kind === 'file' && item.type.indexOf('image') >= 0) {
        const blob = item.getAsFile();
        if (!blob) continue;
        this._addImages([blob]);
      }
    }
  };

  private readonly _handleCleanup = async () => {
    if (
      this.chatContext.status === 'loading' ||
      this.chatContext.status === 'transmitting' ||
      !this.chatContext.messages.length
    ) {
      return;
    }
    await this.cleanupHistories();
  };

  private readonly _handleImageUpload = async () => {
    const images = await openFileOrFiles({
      acceptType: 'Images',
      multiple: true,
    });
    if (!images) return;
    this._addImages(images);
  };

  private readonly _handleAbort = () => {
    this.chatContext.abortController?.abort();
    this.updateContext({ status: 'success' });
    reportResponse('aborted:stop');
  };

  private readonly _handleImageRemove = (index: number) => {
    const oldImages = this.chatContext.images;
    const newImages = oldImages.filter((_, i) => i !== index);
    this.updateContext({ images: newImages });
  };

  private readonly _onTextareaSend = async (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const value = this.textarea.value.trim();
    if (value.length === 0) return;

    this.textarea.value = '';
    this._isInputEmpty = true;
    this.textarea.style.height = 'unset';

    await this._send(value);
  };

  private readonly _send = async (text: string) => {
    const { images, status, currentChatBlockId, currentSessionId } =
      this.chatContext;
    const chatBlockExists = !!currentChatBlockId;
    let content = '';

    if (status === 'loading' || status === 'transmitting') return;
    if (!text) return;

    try {
      const { doc } = this.host;
      const promptName = this._getPromptName();

      this.updateContext({
        images: [],
        status: 'loading',
        error: null,
      });

      const attachments = await Promise.all(
        images?.map(image => readBlobAsURL(image))
      );

      const userInfo = await AIProvider.userInfo;
      this.updateContext({
        messages: [
          ...this.chatContext.messages,
          {
            id: '',
            content: text,
            role: 'user',
            createdAt: new Date().toISOString(),
            attachments,
            userId: userInfo?.id,
            userName: userInfo?.name,
            avatarUrl: userInfo?.avatarUrl ?? undefined,
          },
          {
            id: '',
            content: '',
            role: 'assistant',
            createdAt: new Date().toISOString(),
          },
        ],
      });

      // must update prompt name after local chat message is updated
      // otherwise, the unauthorized error can not be rendered properly
      await this._updatePromptName(promptName);

      // If has not forked a chat session, fork a new one
      let chatSessionId = currentSessionId;
      if (!chatSessionId) {
        const forkSessionId = await AIProvider.forkChat?.({
          workspaceId: doc.workspace.id,
          docId: doc.id,
          sessionId: this.parentSessionId,
          latestMessageId: this.latestMessageId,
        });
        if (!forkSessionId) return;
        this.updateContext({
          currentSessionId: forkSessionId,
        });
        chatSessionId = forkSessionId;
      }

      const abortController = new AbortController();
      const stream = AIProvider.actions.chat?.({
        input: text,
        sessionId: chatSessionId,
        docId: doc.id,
        attachments: images,
        workspaceId: doc.workspace.id,
        host: this.host,
        stream: true,
        signal: abortController.signal,
        where: 'ai-chat-block',
        control: 'chat-send',
      });

      if (stream) {
        this.updateContext({
          abortController,
        });

        for await (const text of stream) {
          const messages = [...this.chatContext.messages];
          const last = messages[messages.length - 1] as ChatMessage;
          last.content += text;
          this.updateContext({ messages, status: 'transmitting' });
          content += text;
        }

        this.updateContext({ status: 'success' });
      }
    } catch (error) {
      console.error(error);
      this.updateContext({ status: 'error', error: error as AIError });
    } finally {
      if (content) {
        if (!chatBlockExists) {
          await this.createChatBlock();
        }
        // Update new chat block messages if there are contents returned from AI
        await this.updateChatBlock();
      }

      this.updateContext({ abortController: null });
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-block-input': ChatBlockInput;
  }
}
