import { DataViewBlockSchemaExtension } from '@blocksuite/affine-block-data-view';
import { DatabaseSelectionExtension } from '@blocksuite/affine-block-database';
import { ImageStoreSpec } from '@blocksuite/affine-block-image';
import { SurfaceBlockSchemaExtension } from '@blocksuite/affine-block-surface';
import { TableSelectionExtension } from '@blocksuite/affine-block-table';
import {
  AttachmentBlockSchemaExtension,
  BookmarkBlockSchemaExtension,
  CodeBlockSchemaExtension,
  DatabaseBlockSchemaExtension,
  DividerBlockSchemaExtension,
  EdgelessTextBlockSchemaExtension,
  EmbedFigmaBlockSchemaExtension,
  EmbedGithubBlockSchemaExtension,
  EmbedHtmlBlockSchemaExtension,
  EmbedLinkedDocBlockSchemaExtension,
  EmbedLoomBlockSchemaExtension,
  EmbedSyncedDocBlockSchemaExtension,
  EmbedYoutubeBlockSchemaExtension,
  FrameBlockSchemaExtension,
  ImageBlockSchemaExtension,
  LatexBlockSchemaExtension,
  ListBlockSchemaExtension,
  NoteBlockSchemaExtension,
  ParagraphBlockSchemaExtension,
  RootBlockSchemaExtension,
  SurfaceRefBlockSchemaExtension,
  TableBlockSchemaExtension,
} from '@blocksuite/affine-model';
import {
  HighlightSelectionExtension,
  ImageSelectionExtension,
} from '@blocksuite/affine-shared/selection';
import {
  FeatureFlagService,
  FileSizeLimitService,
  LinkPreviewerService,
} from '@blocksuite/affine-shared/services';
import {
  BlockSelectionExtension,
  CursorSelectionExtension,
  SurfaceSelectionExtension,
  TextSelectionExtension,
} from '@blocksuite/block-std';
import type { ExtensionType } from '@blocksuite/store';

import {
  AdapterFactoryExtensions,
  HtmlAdapterExtension,
  MarkdownAdapterExtension,
  NotionHtmlAdapterExtension,
  PlainTextAdapterExtension,
} from '../adapters/extension.js';

export const StoreExtensions: ExtensionType[] = [
  CodeBlockSchemaExtension,
  ParagraphBlockSchemaExtension,
  RootBlockSchemaExtension,
  ListBlockSchemaExtension,
  NoteBlockSchemaExtension,
  DividerBlockSchemaExtension,
  ImageBlockSchemaExtension,
  SurfaceBlockSchemaExtension,
  BookmarkBlockSchemaExtension,
  FrameBlockSchemaExtension,
  DatabaseBlockSchemaExtension,
  SurfaceRefBlockSchemaExtension,
  DataViewBlockSchemaExtension,
  AttachmentBlockSchemaExtension,
  EmbedSyncedDocBlockSchemaExtension,
  EmbedLinkedDocBlockSchemaExtension,
  EmbedHtmlBlockSchemaExtension,
  EmbedGithubBlockSchemaExtension,
  EmbedFigmaBlockSchemaExtension,
  EmbedLoomBlockSchemaExtension,
  EmbedYoutubeBlockSchemaExtension,
  EdgelessTextBlockSchemaExtension,
  LatexBlockSchemaExtension,
  TableBlockSchemaExtension,

  BlockSelectionExtension,
  TextSelectionExtension,
  SurfaceSelectionExtension,
  CursorSelectionExtension,
  HighlightSelectionExtension,
  ImageSelectionExtension,
  DatabaseSelectionExtension,
  TableSelectionExtension,

  FeatureFlagService,
  LinkPreviewerService,
  FileSizeLimitService,
  ImageStoreSpec,

  HtmlAdapterExtension,
  MarkdownAdapterExtension,
  NotionHtmlAdapterExtension,
  PlainTextAdapterExtension,

  AdapterFactoryExtensions,
].flat();
