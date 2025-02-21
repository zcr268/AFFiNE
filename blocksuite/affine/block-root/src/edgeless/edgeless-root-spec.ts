import { AFFINE_EDGELESS_AUTO_CONNECT_WIDGET } from '@blocksuite/affine-widget-edgeless-auto-connect';
import { AFFINE_FRAME_TITLE_WIDGET } from '@blocksuite/affine-widget-frame-title';
import { AFFINE_EDGELESS_REMOTE_SELECTION_WIDGET } from '@blocksuite/affine-widget-remote-selection';
import {
  BlockServiceWatcher,
  BlockViewExtension,
  WidgetViewExtension,
} from '@blocksuite/block-std';
import { ToolController } from '@blocksuite/block-std/gfx';
import type { ExtensionType } from '@blocksuite/store';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { CommonSpecs } from '../common-specs/index.js';
import { AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET } from '../widgets/edgeless-zoom-toolbar/index.js';
import { EDGELESS_ELEMENT_TOOLBAR_WIDGET } from '../widgets/element-toolbar/index.js';
import { NOTE_SLICER_WIDGET } from './components/note-slicer/index.js';
import { EDGELESS_NAVIGATOR_BLACK_BACKGROUND_WIDGET } from './components/presentation/edgeless-navigator-black-background.js';
import { EDGELESS_DRAGGING_AREA_WIDGET } from './components/rects/edgeless-dragging-area-rect.js';
import { EDGELESS_SELECTED_RECT_WIDGET } from './components/rects/edgeless-selected-rect.js';
import { EDGELESS_TOOLBAR_WIDGET } from './components/toolbar/edgeless-toolbar.js';
import { EdgelessRootService } from './edgeless-root-service.js';

export const edgelessRemoteSelectionWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_EDGELESS_REMOTE_SELECTION_WIDGET,
  literal`${unsafeStatic(AFFINE_EDGELESS_REMOTE_SELECTION_WIDGET)}`
);
export const edgelessZoomToolbarWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET,
  literal`${unsafeStatic(AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET)}`
);
export const frameTitleWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_FRAME_TITLE_WIDGET,
  literal`${unsafeStatic(AFFINE_FRAME_TITLE_WIDGET)}`
);
export const elementToolbarWidget = WidgetViewExtension(
  'affine:page',
  EDGELESS_ELEMENT_TOOLBAR_WIDGET,
  literal`${unsafeStatic(EDGELESS_ELEMENT_TOOLBAR_WIDGET)}`
);
export const autoConnectWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_EDGELESS_AUTO_CONNECT_WIDGET,
  literal`${unsafeStatic(AFFINE_EDGELESS_AUTO_CONNECT_WIDGET)}`
);
export const edgelessDraggingAreaWidget = WidgetViewExtension(
  'affine:page',
  EDGELESS_DRAGGING_AREA_WIDGET,
  literal`${unsafeStatic(EDGELESS_DRAGGING_AREA_WIDGET)}`
);
export const noteSlicerWidget = WidgetViewExtension(
  'affine:page',
  NOTE_SLICER_WIDGET,
  literal`${unsafeStatic(NOTE_SLICER_WIDGET)}`
);
export const edgelessNavigatorBlackBackgroundWidget = WidgetViewExtension(
  'affine:page',
  EDGELESS_NAVIGATOR_BLACK_BACKGROUND_WIDGET,
  literal`${unsafeStatic(EDGELESS_NAVIGATOR_BLACK_BACKGROUND_WIDGET)}`
);
export const edgelessSelectedRectWidget = WidgetViewExtension(
  'affine:page',
  EDGELESS_SELECTED_RECT_WIDGET,
  literal`${unsafeStatic(EDGELESS_SELECTED_RECT_WIDGET)}`
);
export const edgelessToolbarWidget = WidgetViewExtension(
  'affine:page',
  EDGELESS_TOOLBAR_WIDGET,
  literal`${unsafeStatic(EDGELESS_TOOLBAR_WIDGET)}`
);

class EdgelessLocker extends BlockServiceWatcher {
  static override readonly flavour = 'affine:page';

  override mounted() {
    const service = this.blockService;
    service.disposables.add(
      service.specSlots.viewConnected.on(({ service }) => {
        // Does not allow the user to move and zoom.
        (service as EdgelessRootService).locked = true;
      })
    );
  }
}

const EdgelessCommonExtension: ExtensionType[] = [
  CommonSpecs,
  ToolController,
  EdgelessRootService,
].flat();

export const EdgelessRootBlockSpec: ExtensionType[] = [
  ...EdgelessCommonExtension,
  BlockViewExtension('affine:page', literal`affine-edgeless-root`),
  edgelessRemoteSelectionWidget,
  edgelessZoomToolbarWidget,
  frameTitleWidget,
  elementToolbarWidget,
  autoConnectWidget,
  edgelessDraggingAreaWidget,
  noteSlicerWidget,
  edgelessNavigatorBlackBackgroundWidget,
  edgelessSelectedRectWidget,
  edgelessToolbarWidget,
];

export const PreviewEdgelessRootBlockSpec: ExtensionType[] = [
  ...EdgelessCommonExtension,
  BlockViewExtension('affine:page', literal`affine-edgeless-root-preview`),
  EdgelessLocker,
];
