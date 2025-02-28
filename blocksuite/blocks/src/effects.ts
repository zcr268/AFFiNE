import { effects as blockAttachmentEffects } from '@blocksuite/affine-block-attachment/effects';
import { effects as blockBookmarkEffects } from '@blocksuite/affine-block-bookmark/effects';
import { effects as blockCodeEffects } from '@blocksuite/affine-block-code/effects';
import { effects as blockDataViewEffects } from '@blocksuite/affine-block-data-view/effects';
import { effects as blockDatabaseEffects } from '@blocksuite/affine-block-database/effects';
import { effects as blockDividerEffects } from '@blocksuite/affine-block-divider/effects';
import { effects as blockEdgelessTextEffects } from '@blocksuite/affine-block-edgeless-text/effects';
import { effects as blockEmbedEffects } from '@blocksuite/affine-block-embed/effects';
import { effects as blockFrameEffects } from '@blocksuite/affine-block-frame/effects';
import { effects as blockImageEffects } from '@blocksuite/affine-block-image/effects';
import { effects as blockLatexEffects } from '@blocksuite/affine-block-latex/effects';
import { effects as blockListEffects } from '@blocksuite/affine-block-list/effects';
import { effects as blockNoteEffects } from '@blocksuite/affine-block-note/effects';
import { effects as blockParagraphEffects } from '@blocksuite/affine-block-paragraph/effects';
import { effects as blockRootEffects } from '@blocksuite/affine-block-root/effects';
import { effects as blockSurfaceEffects } from '@blocksuite/affine-block-surface/effects';
import { effects as blockSurfaceRefEffects } from '@blocksuite/affine-block-surface-ref/effects';
import { effects as blockTableEffects } from '@blocksuite/affine-block-table/effects';
import { BlockSelection } from '@blocksuite/affine-components/block-selection';
import { BlockZeroWidth } from '@blocksuite/affine-components/block-zero-width';
import { effects as componentCaptionEffects } from '@blocksuite/affine-components/caption';
import { effects as componentColorPickerEffects } from '@blocksuite/affine-components/color-picker';
import { effects as componentContextMenuEffects } from '@blocksuite/affine-components/context-menu';
import { effects as componentDatePickerEffects } from '@blocksuite/affine-components/date-picker';
import { effects as componentDocTitleEffects } from '@blocksuite/affine-components/doc-title';
import { effects as componentDropIndicatorEffects } from '@blocksuite/affine-components/drop-indicator';
import { effects as componentEmbedCardModalEffects } from '@blocksuite/affine-components/embed-card-modal';
import { FilterableListComponent } from '@blocksuite/affine-components/filterable-list';
import { IconButton } from '@blocksuite/affine-components/icon-button';
import { effects as componentPortalEffects } from '@blocksuite/affine-components/portal';
import { effects as componentRichTextEffects } from '@blocksuite/affine-components/rich-text';
import { SmoothCorner } from '@blocksuite/affine-components/smooth-corner';
import { effects as componentToggleButtonEffects } from '@blocksuite/affine-components/toggle-button';
import { ToggleSwitch } from '@blocksuite/affine-components/toggle-switch';
import { effects as componentToolbarEffects } from '@blocksuite/affine-components/toolbar';
import { effects as fragmentFramePanelEffects } from '@blocksuite/affine-fragment-frame-panel/effects';
import { effects as fragmentOutlineEffects } from '@blocksuite/affine-fragment-outline/effects';
import { effects as widgetDragHandleEffects } from '@blocksuite/affine-widget-drag-handle/effects';
import { effects as widgetEdgelessAutoConnectEffects } from '@blocksuite/affine-widget-edgeless-auto-connect/effects';
import { effects as widgetFrameTitleEffects } from '@blocksuite/affine-widget-frame-title/effects';
import { effects as widgetRemoteSelectionEffects } from '@blocksuite/affine-widget-remote-selection/effects';
import { effects as widgetScrollAnchoringEffects } from '@blocksuite/affine-widget-scroll-anchoring/effects';
import { effects as stdEffects } from '@blocksuite/block-std/effects';
import { effects as dataViewEffects } from '@blocksuite/data-view/effects';
import { effects as inlineEffects } from '@blocksuite/inline/effects';

import { registerSpecs } from './extensions/register.js';

export function effects() {
  registerSpecs();

  stdEffects();
  inlineEffects();

  dataViewEffects();

  blockNoteEffects();
  blockAttachmentEffects();
  blockBookmarkEffects();
  blockFrameEffects();
  blockListEffects();
  blockParagraphEffects();
  blockEmbedEffects();
  blockSurfaceEffects();
  blockImageEffects();
  blockDatabaseEffects();
  blockSurfaceRefEffects();
  blockLatexEffects();
  blockEdgelessTextEffects();
  blockDividerEffects();
  blockDataViewEffects();
  blockCodeEffects();
  blockTableEffects();
  blockRootEffects();

  componentCaptionEffects();
  componentContextMenuEffects();
  componentDatePickerEffects();
  componentPortalEffects();
  componentRichTextEffects();
  componentToolbarEffects();
  componentDropIndicatorEffects();
  componentToggleButtonEffects();
  componentColorPickerEffects();
  componentEmbedCardModalEffects();
  componentDocTitleEffects();

  widgetScrollAnchoringEffects();
  widgetFrameTitleEffects();
  widgetRemoteSelectionEffects();
  widgetDragHandleEffects();
  widgetEdgelessAutoConnectEffects();

  fragmentFramePanelEffects();
  fragmentOutlineEffects();

  customElements.define('icon-button', IconButton);
  customElements.define('smooth-corner', SmoothCorner);
  customElements.define('toggle-switch', ToggleSwitch);
  customElements.define('affine-filterable-list', FilterableListComponent);
  customElements.define('block-zero-width', BlockZeroWidth);
  customElements.define('affine-block-selection', BlockSelection);
}
