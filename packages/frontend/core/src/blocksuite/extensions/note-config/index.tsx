import type { ElementOrFactory } from '@affine/component';
import { JournalService } from '@affine/core/modules/journal';
import { NoteConfigExtension } from '@blocksuite/affine/blocks';
import type { FrameworkProvider } from '@toeverything/infra';
import { html, type TemplateResult } from 'lit';

import { BlocksuiteEditorJournalDocTitle } from '../../block-suite-editor/journal-doc-title';
import { EdgelessNoteHeader } from './edgeless-note-header';

export function patchForEdgelessNoteConfig(
  framework: FrameworkProvider,
  reactToLit: (element: ElementOrFactory) => TemplateResult
) {
  return NoteConfigExtension({
    edgelessNoteHeader: ({ note }) =>
      reactToLit(<EdgelessNoteHeader note={note} />),
    pageBlockTitle: ({ note }) => {
      const journalService = framework.get(JournalService);
      const isJournal = !!journalService.journalDate$(note.doc.id).value;
      if (isJournal) {
        return reactToLit(<BlocksuiteEditorJournalDocTitle page={note.doc} />);
      } else {
        return html`<doc-title .doc=${note.doc}></doc-title>`;
      }
    },
  });
}
