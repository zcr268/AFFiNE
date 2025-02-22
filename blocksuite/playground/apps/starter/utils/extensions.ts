import {
  CommunityCanvasTextFonts,
  DocModeProvider,
  EdgelessEditorBlockSpecs,
  EditorSettingExtension,
  FeatureFlagService,
  FontConfigExtension,
  PageEditorBlockSpecs,
  ParseDocUrlExtension,
  RefNodeSlotsProvider,
} from '@blocksuite/blocks';
import { type TestAffineEditorContainer } from '@blocksuite/integration-test';
import type { ExtensionType, Store, Workspace } from '@blocksuite/store';

import {
  mockDocModeService,
  mockEditorSetting,
  mockParseDocUrlService,
} from '../../_common/mock-services';

export function getTestCommonExtensions(
  editor: TestAffineEditorContainer
): ExtensionType[] {
  return [
    FontConfigExtension(CommunityCanvasTextFonts),
    EditorSettingExtension(mockEditorSetting()),
    ParseDocUrlExtension(mockParseDocUrlService(editor.doc.workspace)),
    {
      setup: di => {
        di.override(DocModeProvider, mockDocModeService(editor));
      },
    },
  ];
}

export function createTestEditor(store: Store, workspace: Workspace) {
  store
    .get(FeatureFlagService)
    .setFlag('enable_advanced_block_visibility', true);

  const editor = document.createElement('affine-editor-container');

  editor.autofocus = true;
  editor.doc = store;

  const defaultExtensions = getTestCommonExtensions(editor);
  editor.pageSpecs = [...PageEditorBlockSpecs, ...defaultExtensions];
  editor.edgelessSpecs = [...EdgelessEditorBlockSpecs, ...defaultExtensions];

  editor.std
    .get(RefNodeSlotsProvider)
    .docLinkClicked.on(({ pageId: docId }) => {
      const target = workspace.getDoc(docId);
      if (!target) {
        throw new Error(`Failed to jump to doc ${docId}`);
      }
      target.load();
      editor.doc = target;
    });

  return editor;
}
