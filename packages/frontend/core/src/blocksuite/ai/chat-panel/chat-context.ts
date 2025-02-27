import type { Signal } from '@preact/signals-core';

import type { AIError } from '../components/ai-item/types';

export type ChatMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  attachments?: string[];
  createdAt: string;
};

export type ChatAction = {
  action: string;
  messages: ChatMessage[];
  sessionId: string;
  createdAt: string;
};

export type ChatItem = ChatMessage | ChatAction;

export function isChatAction(item: ChatItem): item is ChatAction {
  return 'action' in item;
}

export function isChatMessage(item: ChatItem): item is ChatMessage {
  return 'role' in item;
}

export type ChatStatus =
  | 'loading'
  | 'success'
  | 'error'
  | 'idle'
  | 'transmitting';

export interface DocContext {
  docId: string;
  plaintext?: string;
  markdown?: string;
  images?: File[];
}

export type ChatContextValue = {
  // history messages of the chat
  items: ChatItem[];
  status: ChatStatus;
  error: AIError | null;
  // plain-text of the selected content
  quote: string;
  // markdown of the selected content
  markdown: string;
  // images of the selected content or user uploaded
  images: File[];
  // chips of workspace doc or user uploaded file
  chips: ChatChip[];
  abortController: AbortController | null;
};

export type ChatBlockMessage = ChatMessage & {
  userId?: string;
  userName?: string;
  avatarUrl?: string;
};

export type ChipState = 'candidate' | 'processing' | 'success' | 'failed';

export interface BaseChip {
  /**
   * candidate: the chip is a candidate for the chat
   * processing: the chip is processing
   * success: the chip is successfully processed
   * failed: the chip is failed to process
   */
  state: ChipState;
  tooltip?: string;
}

export interface DocChip extends BaseChip {
  docId: string;
  markdown?: Signal<string>;
  tokenCount?: number;
}

export interface FileChip extends BaseChip {
  fileName: string;
  fileId: string;
  fileType: string;
}

export type ChatChip = DocChip | FileChip;
