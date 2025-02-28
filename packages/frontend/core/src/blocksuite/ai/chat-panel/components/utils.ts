import type { CopilotContextDoc, CopilotContextFile } from '@affine/graphql';
import { LoadingIcon } from '@blocksuite/affine/blocks';
import { WarningIcon } from '@blocksuite/icons/lit';
import { type TemplateResult } from 'lit';

import type { ChatChip, ChipState, DocChip, FileChip } from '../chat-context';

export function getChipTooltip(
  state: ChipState,
  name: string,
  tooltip?: string
) {
  if (tooltip) {
    return tooltip;
  }
  if (state === 'candidate') {
    return 'Click to add doc';
  }
  if (state === 'processing') {
    return 'Processing...';
  }
  if (state === 'failed') {
    return 'Failed to process';
  }
  return name;
}

export function getChipIcon(
  state: ChipState,
  icon: TemplateResult<1>
): TemplateResult<1> {
  const isLoading = state === 'processing';
  const isFailed = state === 'failed';
  if (isFailed) {
    return WarningIcon();
  }
  if (isLoading) {
    return LoadingIcon;
  }
  return icon;
}

export function isDocChip(chip: ChatChip): chip is DocChip {
  return 'docId' in chip;
}

export function isFileChip(chip: ChatChip): chip is FileChip {
  return 'fileId' in chip;
}

export function isDocContext(
  context: CopilotContextDoc | CopilotContextFile
): context is CopilotContextDoc {
  return !('blobId' in context);
}

export function isFileContext(
  context: CopilotContextDoc | CopilotContextFile
): context is CopilotContextFile {
  return 'blobId' in context;
}

export function getChipKey(chip: ChatChip) {
  if (isDocChip(chip)) {
    return chip.docId;
  }
  if (isFileChip(chip)) {
    return chip.fileId;
  }
  return null;
}

export function estimateTokenCount(text: string): number {
  const chinese = text.match(/[\u4e00-\u9fa5]/g)?.length || 0;
  const english = text.replace(/[\u4e00-\u9fa5]/g, '');
  // Split English text into words by whitespace
  const englishWords = english.trim().split(/\s+/).length;

  // Chinese characters: 1 character ≈ 2.5 tokens
  // English words: 1 word ≈ 1.3 tokens
  return Math.ceil(chinese * 2.5 + englishWords * 1.3);
}
