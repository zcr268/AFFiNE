import type { EditorHost } from '@blocksuite/affine/block-std';
import { isInsidePageEditor } from '@blocksuite/affine/blocks';

import type { AIItemGroupConfig } from '../../components/ai-item/types';

export function filterAIItemGroup(
  host: EditorHost,
  configs: AIItemGroupConfig[]
): AIItemGroupConfig[] {
  const editorMode = isInsidePageEditor(host) ? 'page' : 'edgeless';
  return configs
    .map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.showWhen
          ? item.showWhen(host.command.chain(), editorMode, host)
          : true
      ),
    }))
    .filter(group => group.items.length > 0);
}
