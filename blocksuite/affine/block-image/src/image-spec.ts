import {
  BlockViewExtension,
  FlavourExtension,
  WidgetViewExtension,
} from '@blocksuite/block-std';
import type { ExtensionType } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import { ImageBlockAdapterExtensions } from './adapters/extension.js';
import { ImageProxyService } from './image-proxy-service.js';
import { ImageBlockService, ImageDropOption } from './image-service.js';

export const imageToolbarWidget = WidgetViewExtension(
  'affine:image',
  'imageToolbar',
  literal`affine-image-toolbar-widget`
);

export const ImageBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:image'),
  ImageBlockService,
  BlockViewExtension('affine:image', model => {
    const parent = model.doc.getParent(model.id);

    if (parent?.flavour === 'affine:surface') {
      return literal`affine-edgeless-image`;
    }

    return literal`affine-image`;
  }),
  imageToolbarWidget,
  ImageDropOption,
  ImageBlockAdapterExtensions,
].flat();

export const ImageStoreSpec: ExtensionType[] = [ImageProxyService];
