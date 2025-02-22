import { useRefEffect } from '@affine/component';
import { EditorLoading } from '@affine/component/page-detail-skeleton';
import { ServerService } from '@affine/core/modules/cloud';
import {
  EditorSettingService,
  fontStyleOptions,
} from '@affine/core/modules/editor-setting';
import {
  customImageProxyMiddleware,
  type DocMode,
  ImageProxyService,
  LinkPreviewerService,
} from '@blocksuite/affine/blocks';
import { DisposableGroup } from '@blocksuite/affine/global/utils';
import type { Store } from '@blocksuite/affine/store';
import { Slot } from '@radix-ui/react-slot';
import { useLiveData, useService } from '@toeverything/infra';
import { cssVar } from '@toeverything/theme';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';

import type { DefaultOpenProperty } from '../../doc-properties';
import {
  type AffineEditorContainer,
  BlocksuiteEditorContainer,
} from './blocksuite-editor-container';
import { NoPageRootError } from './no-page-error';

export type EditorProps = {
  page: Store;
  mode: DocMode;
  shared?: boolean;
  readonly?: boolean;
  defaultOpenProperty?: DefaultOpenProperty;
  // on Editor ready
  onEditorReady?: (editor: AffineEditorContainer) => (() => void) | void;
  style?: CSSProperties;
  className?: string;
};

const BlockSuiteEditorImpl = ({
  mode,
  page,
  className,
  shared,
  readonly,
  style,
  onEditorReady,
  defaultOpenProperty,
}: EditorProps) => {
  useEffect(() => {
    const disposable = page.slots.blockUpdated.once(() => {
      page.workspace.meta.setDocMeta(page.id, {
        updatedDate: Date.now(),
      });
    });
    return () => {
      disposable.dispose();
    };
  }, [page]);

  const server = useService(ServerService).server;

  const editorRef = useRefEffect(
    (editor: AffineEditorContainer) => {
      globalThis.currentEditor = editor;
      let canceled = false;
      const disposableGroup = new DisposableGroup();

      // Invoke onLoad once the editor has been mounted to the DOM.
      if (canceled) {
        return;
      }

      // provide image proxy endpoint to blocksuite
      const imageProxyUrl = new URL(
        BUILD_CONFIG.imageProxyUrl,
        server.baseUrl
      ).toString();

      const linkPreviewUrl = new URL(
        BUILD_CONFIG.linkPreviewUrl,
        server.baseUrl
      ).toString();

      editor.std.clipboard.use(customImageProxyMiddleware(imageProxyUrl));
      page.get(LinkPreviewerService).setEndpoint(linkPreviewUrl);
      page.get(ImageProxyService).setImageProxyURL(imageProxyUrl);

      editor.updateComplete
        .then(() => {
          if (onEditorReady) {
            const dispose = onEditorReady(editor);
            if (dispose) {
              disposableGroup.add(dispose);
            }
          }
        })
        .catch(error => {
          console.error('Error updating editor', error);
        });

      return () => {
        canceled = true;
        disposableGroup.dispose();
      };
    },
    [onEditorReady, page, server]
  );

  return (
    <BlocksuiteEditorContainer
      mode={mode}
      page={page}
      shared={shared}
      readonly={readonly}
      defaultOpenProperty={defaultOpenProperty}
      ref={editorRef}
      className={className}
      style={style}
    />
  );
};

export const BlockSuiteEditor = (props: EditorProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const editorSetting = useService(EditorSettingService).editorSetting;
  const settings = useLiveData(
    editorSetting.settings$.selector(s => ({
      fontFamily: s.fontFamily,
      customFontFamily: s.customFontFamily,
      fullWidthLayout: s.fullWidthLayout,
    }))
  );
  const fontFamily = useMemo(() => {
    const fontStyle = fontStyleOptions.find(
      option => option.key === settings.fontFamily
    );
    if (!fontStyle) {
      return cssVar('fontSansFamily');
    }
    const customFontFamily = settings.customFontFamily;

    return customFontFamily && fontStyle.key === 'Custom'
      ? `${customFontFamily}, ${fontStyle.value}`
      : fontStyle.value;
  }, [settings.customFontFamily, settings.fontFamily]);

  useEffect(() => {
    if (props.page.root) {
      setIsLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      disposable.dispose();
      setError(new NoPageRootError(props.page));
    }, 20 * 1000);
    const disposable = props.page.slots.rootAdded.once(() => {
      setIsLoading(false);
      clearTimeout(timer);
    });
    return () => {
      disposable.dispose();
      clearTimeout(timer);
    };
  }, [props.page]);

  if (error) {
    throw error;
  }

  return (
    <Slot style={{ '--affine-font-family': fontFamily } as CSSProperties}>
      {isLoading ? (
        <EditorLoading />
      ) : (
        <BlockSuiteEditorImpl key={props.page.id} {...props} />
      )}
    </Slot>
  );
};
