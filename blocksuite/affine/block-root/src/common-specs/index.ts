import { FileDropExtension } from '@blocksuite/affine-components/drop-indicator';
import {
  DNDAPIExtension,
  DocModeService,
  EmbedOptionService,
  PageViewportServiceExtension,
  ThemeService,
} from '@blocksuite/affine-shared/services';
import { FlavourExtension } from '@blocksuite/block-std';
import type { ExtensionType } from '@blocksuite/store';

import { RootBlockAdapterExtensions } from '../adapters/extension';
import {
  docRemoteSelectionWidget,
  dragHandleWidget,
  embedCardToolbarWidget,
  formatBarWidget,
  innerModalWidget,
  linkedDocWidget,
  modalWidget,
  scrollAnchoringWidget,
  slashMenuWidget,
  viewportOverlayWidget,
} from './widgets';

export const CommonSpecs: ExtensionType[] = [
  FlavourExtension('affine:page'),
  DocModeService,
  ThemeService,
  EmbedOptionService,
  PageViewportServiceExtension,
  DNDAPIExtension,
  FileDropExtension,
  ...RootBlockAdapterExtensions,

  modalWidget,
  innerModalWidget,
  slashMenuWidget,
  linkedDocWidget,
  dragHandleWidget,
  embedCardToolbarWidget,
  formatBarWidget,
  docRemoteSelectionWidget,
  viewportOverlayWidget,
  scrollAnchoringWidget,
];

export * from './widgets';
