import { toReactNode } from '@affine/component';
import { AIChatBlockPeekViewTemplate } from '@affine/core/blocksuite/presets';
import { AINetworkSearchService } from '@affine/core/modules/ai-button/services/network-search';
import type { EditorHost } from '@blocksuite/affine/block-std';
import { useFramework } from '@toeverything/infra';
import { useMemo } from 'react';

import type { AIChatBlockModel } from '../../../../blocksuite/blocks/ai-chat-block/model/ai-chat-model';
import { createPageModePreviewSpecs } from '../../../../components/blocksuite/block-suite-editor/specs/preview';

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
    const previewSpecBuilder = createPageModePreviewSpecs(framework);
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
  }, [framework, model, host, searchService]);
};
