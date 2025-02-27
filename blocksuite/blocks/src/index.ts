export * from './adapters/index.js';
export * from './extensions/index.js';
export * from './schemas.js';
export * from '@blocksuite/affine-block-attachment';
export * from '@blocksuite/affine-block-bookmark';
export * from '@blocksuite/affine-block-code';
export * from '@blocksuite/affine-block-data-view';
export * from '@blocksuite/affine-block-database';
export * from '@blocksuite/affine-block-divider';
export * from '@blocksuite/affine-block-edgeless-text';
export * from '@blocksuite/affine-block-embed';
export * from '@blocksuite/affine-block-frame';
export * from '@blocksuite/affine-block-image';
export * from '@blocksuite/affine-block-latex';
export * from '@blocksuite/affine-block-list';
export * from '@blocksuite/affine-block-note';
export * from '@blocksuite/affine-block-paragraph';
export * from '@blocksuite/affine-block-root';
export * from '@blocksuite/affine-block-surface';
export * from '@blocksuite/affine-block-surface-ref';
export * from '@blocksuite/affine-block-table';
export {
  menu,
  type MenuOptions,
  onMenuOpen,
} from '@blocksuite/affine-components/context-menu';
export {
  DocTitle,
  getDocTitleByEditorHost,
} from '@blocksuite/affine-components/doc-title';
export {
  HoverController,
  whenHover,
} from '@blocksuite/affine-components/hover';
export {
  ArrowDownSmallIcon,
  CloseIcon,
  DocIcon,
  DualLinkIcon16,
  LinkedDocIcon,
  TagsIcon,
} from '@blocksuite/affine-components/icons';
export * from '@blocksuite/affine-components/icons';
export * from '@blocksuite/affine-components/peek';
export {
  createLitPortal,
  createSimplePortal,
} from '@blocksuite/affine-components/portal';
export * from '@blocksuite/affine-components/rich-text';
export { toast } from '@blocksuite/affine-components/toast';
export {
  type AdvancedMenuItem,
  type FatMenuItems,
  groupsToActions,
  MenuContext,
  type MenuItem,
  type MenuItemGroup,
  renderActions,
  renderGroups,
  renderToolbarSeparator,
  ToolbarMoreMenuConfigExtension,
  Tooltip,
} from '@blocksuite/affine-components/toolbar';
export * from '@blocksuite/affine-fragment-frame-panel';
export * from '@blocksuite/affine-fragment-outline';
export * from '@blocksuite/affine-model';
export * from '@blocksuite/affine-shared/adapters';
export * from '@blocksuite/affine-shared/commands';
export { HighlightSelection } from '@blocksuite/affine-shared/selection';
export * from '@blocksuite/affine-shared/services';
export { scrollbarStyle } from '@blocksuite/affine-shared/styles';
export {
  ColorVariables,
  FontFamilyVariables,
  SizeVariables,
  StyleVariables,
  unsafeCSSVar,
  unsafeCSSVarV2,
} from '@blocksuite/affine-shared/theme';
export { type AffineTextAttributes } from '@blocksuite/affine-shared/types';
export {
  createButtonPopper,
  createDefaultDoc,
  createSignalFromObservable,
  findNoteBlockModel,
  getLastNoteBlock,
  getPageRootByElement,
  isInsideEdgelessEditor,
  isInsidePageEditor,
  matchModels,
  MOUSE_BUTTON,
  on,
  once,
  openFileOrFiles,
  printToPdf,
  referenceToNode,
  requestConnectedFrame,
  type Signal,
  SpecBuilder,
  SpecProvider,
  stopPropagation,
} from '@blocksuite/affine-shared/utils';
export type { DragBlockPayload } from '@blocksuite/affine-widget-drag-handle';

const env: Record<string, unknown> =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
        ? global
        : {};
const importIdentifier = '__ $BLOCKSUITE_BLOCKS$ __';

if (env[importIdentifier] === true) {
  // https://github.com/yjs/yjs/issues/438
  console.error(
    '@blocksuite/blocks was already imported. This breaks constructor checks and will lead to issues!'
  );
}

env[importIdentifier] = true;
