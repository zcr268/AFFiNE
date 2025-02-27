import { DocsService } from '@affine/core/modules/doc';
import { EditorSettingService } from '@affine/core/modules/editor-setting';
import {
  CreationQuickSearchSession,
  DocsQuickSearchSession,
  LinksQuickSearchSession,
  QuickSearchService,
  RecentDocsQuickSearchSession,
} from '@affine/core/modules/quicksearch';
import { ExternalLinksQuickSearchSession } from '@affine/core/modules/quicksearch/impls/external-links';
import { JournalsQuickSearchSession } from '@affine/core/modules/quicksearch/impls/journals';
import { track } from '@affine/track';
import { LifeCycleWatcher } from '@blocksuite/affine/block-std';
import type { QuickSearchResult } from '@blocksuite/affine/blocks';
import {
  AffineSlashMenuWidget,
  insertLinkByQuickSearchCommand,
  QuickSearchExtension,
} from '@blocksuite/affine/blocks';
import { Text } from '@blocksuite/affine/store';
import type { FrameworkProvider } from '@toeverything/infra';
import { pick } from 'lodash-es';

import type { DocProps } from '../initialization';

export function patchQuickSearchService(framework: FrameworkProvider) {
  const QuickSearch = QuickSearchExtension({
    async openQuickSearch() {
      let searchResult: QuickSearchResult = null;
      searchResult = await new Promise((resolve, reject) =>
        framework.get(QuickSearchService).quickSearch.show(
          [
            framework.get(RecentDocsQuickSearchSession),
            framework.get(CreationQuickSearchSession),
            framework.get(DocsQuickSearchSession),
            framework.get(LinksQuickSearchSession),
            framework.get(ExternalLinksQuickSearchSession),
            framework.get(JournalsQuickSearchSession),
          ],
          result => {
            if (result === null) {
              resolve(null);
              return;
            }

            if (result.source === 'docs') {
              resolve({
                docId: result.payload.docId,
              });
              return;
            }

            if (result.source === 'recent-doc') {
              resolve({
                docId: result.payload.docId,
              });
              return;
            }

            if (result.source === 'link') {
              resolve({
                docId: result.payload.docId,
                params: pick(result.payload, [
                  'mode',
                  'blockIds',
                  'elementIds',
                ]),
              });
              return;
            }

            if (result.source === 'date-picker') {
              result.payload
                .getDocId()
                .then(docId => {
                  if (docId) {
                    resolve({ docId });
                  }
                })
                .catch(reject);
              return;
            }

            if (result.source === 'external-link') {
              const externalUrl = result.payload.url;
              resolve({ externalUrl });
              return;
            }

            if (result.source === 'creation') {
              const docsService = framework.get(DocsService);
              const editorSettingService = framework.get(EditorSettingService);
              const mode =
                result.id === 'creation:create-edgeless' ? 'edgeless' : 'page';
              const docProps: DocProps = {
                page: { title: new Text(result.payload.title) },
                note: editorSettingService.editorSetting.get('affine:note'),
              };
              const newDoc = docsService.createDoc({
                primaryMode: mode,
                docProps,
              });

              resolve({ docId: newDoc.id });
              return;
            }
          },
          {
            label: {
              i18nKey: 'com.affine.cmdk.insert-links',
            },
            placeholder: {
              i18nKey: 'com.affine.cmdk.docs.placeholder',
            },
          }
        )
      );

      return searchResult;
    },
  });

  class SlashMenuQuickSearchExtension extends LifeCycleWatcher {
    static override key = 'slash-menu-quick-search-extension';

    override mounted() {
      super.mounted();
      const { view } = this.std;
      view.viewUpdated.on(payload => {
        if (payload.type !== 'widget' || payload.method !== 'add') {
          return;
        }
        const component = payload.view;
        if (component instanceof AffineSlashMenuWidget) {
          component.config.items.forEach(item => {
            if (
              'action' in item &&
              (item.name === 'Linked Doc' || item.name === 'Link')
            ) {
              item.action = async ({ rootComponent }) => {
                const [success, { insertedLinkType }] =
                  rootComponent.std.command.exec(
                    insertLinkByQuickSearchCommand
                  );

                if (!success) return;

                insertedLinkType
                  ?.then(type => {
                    const flavour = type?.flavour;
                    if (!flavour) return;

                    if (flavour === 'affine:bookmark') {
                      track.doc.editor.slashMenu.bookmark();
                      return;
                    }

                    if (flavour === 'affine:embed-linked-doc') {
                      track.doc.editor.slashMenu.linkDoc({
                        control: 'linkDoc',
                      });
                      return;
                    }
                  })
                  .catch(console.error);
              };
            }
          });
        }
      });
    }
  }

  return [QuickSearch, SlashMenuQuickSearchExtension];
}
