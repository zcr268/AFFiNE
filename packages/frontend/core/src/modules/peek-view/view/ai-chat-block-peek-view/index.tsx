import { toReactNode } from '@affine/component';
import { AIChatBlockPeekViewTemplate } from '@affine/core/blocksuite/ai';
import type { AIChatBlockModel } from '@affine/core/blocksuite/ai/blocks/ai-chat-block/model/ai-chat-model';
import { enableFootnoteConfigExtension } from '@affine/core/blocksuite/extensions';
import { AINetworkSearchService } from '@affine/core/modules/ai-button/services/network-search';
import type { EditorHost } from '@blocksuite/affine/block-std';
import { SpecProvider } from '@blocksuite/affine/blocks';
import { useFramework } from '@toeverything/infra';
import { useMemo } from 'react';

export type AIChatBlockPeekViewProps = {
  model: AIChatBlockModel;
  host: EditorHost;
};

export const AIChatBlockPeekView = ({
  model,
  host,
}: AIChatBlockPeekViewProps) => {
  const framework = useFramework();
  const searchService = framework.get(AINetworkSearchService);
  return useMemo(() => {
    const previewSpecBuilder = enableFootnoteConfigExtension(
      SpecProvider._.getSpec('preview:page')
    );
    const networkSearchConfig = {
      visible: searchService.visible,
      enabled: searchService.enabled,
      setEnabled: searchService.setEnabled,
    };
    const template = AIChatBlockPeekViewTemplate(
      model,
      host,
      previewSpecBuilder,
      networkSearchConfig
    );
    return toReactNode(template);
  }, [model, host, searchService]);
};
