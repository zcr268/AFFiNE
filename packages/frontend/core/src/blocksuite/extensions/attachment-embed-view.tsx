import type { ElementOrFactory } from '@affine/component';
import { AttachmentEmbedPreview } from '@affine/core/components/attachment-viewer/pdf-viewer-embedded';
import { AttachmentEmbedConfigIdentifier } from '@blocksuite/affine/blocks';
import { Bound } from '@blocksuite/affine/global/utils';
import type { ExtensionType } from '@blocksuite/affine/store';
import type { TemplateResult } from 'lit';

export function patchForAttachmentEmbedViews(
  reactToLit: (
    element: ElementOrFactory,
    rerendering?: boolean
  ) => TemplateResult
): ExtensionType {
  return {
    setup: di => {
      di.override(AttachmentEmbedConfigIdentifier('pdf'), () => ({
        name: 'pdf',
        check: (model, maxFileSize) =>
          model.type === 'application/pdf' && model.size <= maxFileSize,
        action: model => {
          const bound = Bound.deserialize(model.xywh);
          bound.w = 537 + 24 + 2;
          bound.h = 759 + 46 + 24 + 2;
          model.doc.updateBlock(model, {
            embed: true,
            style: 'pdf',
            xywh: bound.serialize(),
          });
        },
        template: (model, _blobUrl) =>
          reactToLit(<AttachmentEmbedPreview model={model} />, false),
      }));
    },
  };
}
