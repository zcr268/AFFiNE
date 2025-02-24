import { IconButton } from '@affine/component';
import { useSharingUrl } from '@affine/core/components/hooks/affine/use-share-url';
import { WorkspaceDialogService } from '@affine/core/modules/dialogs';
import { DocService } from '@affine/core/modules/doc';
import { EditorService } from '@affine/core/modules/editor';
import { useInsidePeekView } from '@affine/core/modules/peek-view/view/modal-container';
import { WorkspaceService } from '@affine/core/modules/workspace';
import { extractEmojiIcon } from '@affine/core/utils';
import { useI18n } from '@affine/i18n';
import { track } from '@affine/track';
import { GfxControllerIdentifier } from '@blocksuite/affine/block-std/gfx';
import { type NoteBlockModel } from '@blocksuite/affine/blocks';
import { Bound } from '@blocksuite/affine/global/utils';
import {
  InformationIcon,
  LinkedPageIcon,
  LinkIcon,
  ToggleDownIcon,
  ToggleRightIcon,
} from '@blocksuite/icons/rc';
import { useLiveData, useService, useServices } from '@toeverything/infra';
import { useCallback, useEffect, useMemo, useState } from 'react';

import * as styles from './edgeless-note-header.css';

const EdgelessNoteToggleButton = ({ note }: { note: NoteBlockModel }) => {
  const t = useI18n();
  const [collapsed, setCollapsed] = useState(note.edgeless.collapse);
  const editor = useService(EditorService).editor;
  const editorContainer = useLiveData(editor.editorContainer$);
  const gfx = editorContainer?.std.get(GfxControllerIdentifier);
  const { doc } = useService(DocService);

  const title = useLiveData(doc.title$);
  // only render emoji if it exists (mode or journal icon will not be rendered)
  const { emoji, rest: titleWithoutEmoji } = useMemo(
    () => extractEmojiIcon(title),
    [title]
  );

  useEffect(() => {
    return note.edgeless$.subscribe(({ collapse, collapsedHeight }) => {
      if (
        collapse &&
        collapsedHeight &&
        Math.abs(collapsedHeight - styles.headerHeight) < 1
      ) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    });
  }, [note.edgeless$]);

  useEffect(() => {
    if (!gfx) return;

    const { selection } = gfx;

    const dispose = selection.slots.updated.on(() => {
      if (selection.has(note.id) && selection.editing) {
        note.doc.transact(() => {
          note.edgeless.collapse = false;
        });
      }
    });

    return () => dispose.dispose();
  }, [gfx, note]);

  const toggle = useCallback(() => {
    note.doc.transact(() => {
      if (collapsed) {
        note.edgeless.collapse = false;
      } else {
        const bound = Bound.deserialize(note.xywh);
        bound.h = styles.headerHeight * (note.edgeless.scale ?? 1);
        note.xywh = bound.serialize();
        note.edgeless.collapse = true;
        note.edgeless.collapsedHeight = styles.headerHeight;
        gfx?.selection.clear();
      }
    });
  }, [collapsed, gfx, note]);

  return (
    <>
      <IconButton
        className={styles.button}
        size={styles.iconSize}
        tooltip={t['com.affine.editor.edgeless-note-header.fold-page-block']()}
        data-testid="edgeless-note-toggle-button"
        onClick={toggle}
      >
        {collapsed ? <ToggleRightIcon /> : <ToggleDownIcon />}
      </IconButton>
      <div className={styles.title} data-testid="edgeless-note-title">
        {collapsed && (
          <>
            {emoji && <span>{emoji}</span>}
            <span>{titleWithoutEmoji}</span>
          </>
        )}
      </div>
    </>
  );
};

const ViewInPageButton = () => {
  const t = useI18n();
  const editor = useService(EditorService).editor;

  const viewInPage = useCallback(() => {
    editor.setMode('page');
  }, [editor]);

  return (
    <IconButton
      className={styles.button}
      size={styles.iconSize}
      tooltip={t['com.affine.editor.edgeless-note-header.view-in-page']()}
      data-testid="edgeless-note-view-in-page-button"
      onClick={viewInPage}
    >
      <LinkedPageIcon />
    </IconButton>
  );
};

const InfoButton = ({ note }: { note: NoteBlockModel }) => {
  const t = useI18n();
  const workspaceDialogService = useService(WorkspaceDialogService);

  const onOpenInfoModal = useCallback(() => {
    track.doc.editor.pageBlockHeader.openDocInfo();
    workspaceDialogService.open('doc-info', { docId: note.doc.id });
  }, [note.doc.id, workspaceDialogService]);

  return (
    <IconButton
      className={styles.button}
      size={styles.iconSize}
      tooltip={t['com.affine.page-properties.page-info.view']()}
      data-testid="edgeless-note-info-button"
      onClick={onOpenInfoModal}
    >
      <InformationIcon />
    </IconButton>
  );
};

const LinkButton = ({ note }: { note: NoteBlockModel }) => {
  const t = useI18n();
  const { workspaceService, editorService } = useServices({
    WorkspaceService,
    EditorService,
  });

  const { onClickCopyLink } = useSharingUrl({
    workspaceId: workspaceService.workspace.id,
    pageId: editorService.editor.doc.id,
  });

  const copyLink = useCallback(() => {
    onClickCopyLink('edgeless', [note.id]);
  }, [note.id, onClickCopyLink]);

  return (
    <IconButton
      className={styles.button}
      size={styles.iconSize}
      tooltip={t['com.affine.share-menu.copy']()}
      data-testid="edgeless-note-link-button"
      onClick={copyLink}
    >
      <LinkIcon />
    </IconButton>
  );
};

export const EdgelessNoteHeader = ({ note }: { note: NoteBlockModel }) => {
  const insidePeekView = useInsidePeekView();

  if (!note.isPageBlock()) return null;

  return (
    <div className={styles.header} data-testid="edgeless-page-block-header">
      <EdgelessNoteToggleButton note={note} />
      <ViewInPageButton />
      {!insidePeekView && <InfoButton note={note} />}
      <LinkButton note={note} />
    </div>
  );
};
