import { AFFINE_DRAG_HANDLE_WIDGET } from '@blocksuite/affine-widget-drag-handle';
import { AFFINE_DOC_REMOTE_SELECTION_WIDGET } from '@blocksuite/affine-widget-remote-selection';
import { AFFINE_SCROLL_ANCHORING_WIDGET } from '@blocksuite/affine-widget-scroll-anchoring';
import { WidgetViewExtension } from '@blocksuite/block-std';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { AFFINE_EMBED_CARD_TOOLBAR_WIDGET } from '../widgets/embed-card-toolbar/embed-card-toolbar.js';
import { AFFINE_FORMAT_BAR_WIDGET } from '../widgets/format-bar/format-bar.js';
import { AFFINE_INNER_MODAL_WIDGET } from '../widgets/inner-modal/inner-modal.js';
import { AFFINE_LINKED_DOC_WIDGET } from '../widgets/linked-doc/config.js';
import { AFFINE_MODAL_WIDGET } from '../widgets/modal/modal.js';
import { AFFINE_SLASH_MENU_WIDGET } from '../widgets/slash-menu/index.js';
import { AFFINE_VIEWPORT_OVERLAY_WIDGET } from '../widgets/viewport-overlay/viewport-overlay.js';

export const modalWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_MODAL_WIDGET,
  literal`${unsafeStatic(AFFINE_MODAL_WIDGET)}`
);
export const innerModalWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_INNER_MODAL_WIDGET,
  literal`${unsafeStatic(AFFINE_INNER_MODAL_WIDGET)}`
);
export const slashMenuWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_SLASH_MENU_WIDGET,
  literal`${unsafeStatic(AFFINE_SLASH_MENU_WIDGET)}`
);
export const linkedDocWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_LINKED_DOC_WIDGET,
  literal`${unsafeStatic(AFFINE_LINKED_DOC_WIDGET)}`
);
export const dragHandleWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_DRAG_HANDLE_WIDGET,
  literal`${unsafeStatic(AFFINE_DRAG_HANDLE_WIDGET)}`
);
export const embedCardToolbarWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_EMBED_CARD_TOOLBAR_WIDGET,
  literal`${unsafeStatic(AFFINE_EMBED_CARD_TOOLBAR_WIDGET)}`
);
export const formatBarWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_FORMAT_BAR_WIDGET,
  literal`${unsafeStatic(AFFINE_FORMAT_BAR_WIDGET)}`
);
export const docRemoteSelectionWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_DOC_REMOTE_SELECTION_WIDGET,
  literal`${unsafeStatic(AFFINE_DOC_REMOTE_SELECTION_WIDGET)}`
);
export const viewportOverlayWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_VIEWPORT_OVERLAY_WIDGET,
  literal`${unsafeStatic(AFFINE_VIEWPORT_OVERLAY_WIDGET)}`
);
export const scrollAnchoringWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_SCROLL_ANCHORING_WIDGET,
  literal`${unsafeStatic(AFFINE_SCROLL_ANCHORING_WIDGET)}`
);
