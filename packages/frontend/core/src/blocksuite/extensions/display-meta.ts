import { DocDisplayMetaService } from '@affine/core/modules/doc-display-meta';
import { LifeCycleWatcher, StdIdentifier } from '@blocksuite/affine/block-std';
import type {
  DocDisplayMetaExtension,
  DocDisplayMetaParams,
  Signal,
} from '@blocksuite/affine/blocks';
import {
  createSignalFromObservable,
  DocDisplayMetaProvider,
  referenceToNode,
} from '@blocksuite/affine/blocks';
import type { Container } from '@blocksuite/affine/global/di';
import { LinkedPageIcon, PageIcon } from '@blocksuite/icons/lit';
import { type FrameworkProvider } from '@toeverything/infra';
import type { TemplateResult } from 'lit';

export function buildDocDisplayMetaExtension(framework: FrameworkProvider) {
  const docDisplayMetaService = framework.get(DocDisplayMetaService);

  function iconBuilder(
    icon: typeof PageIcon,
    size = '1.25em',
    style = 'user-select:none;flex-shrink:0;vertical-align:middle;font-size:inherit;margin-bottom:0.1em;'
  ) {
    return icon({
      width: size,
      height: size,
      style,
    });
  }

  class AffineDocDisplayMetaService
    extends LifeCycleWatcher
    implements DocDisplayMetaExtension
  {
    static override key = 'doc-display-meta';

    readonly disposables: (() => void)[] = [];

    static override setup(di: Container) {
      super.setup(di);
      di.override(DocDisplayMetaProvider, this, [StdIdentifier]);
    }

    dispose() {
      while (this.disposables.length > 0) {
        this.disposables.pop()?.();
      }
    }

    icon(
      docId: string,
      { params, title, referenced }: DocDisplayMetaParams = {}
    ): Signal<TemplateResult> {
      const icon$ = docDisplayMetaService
        .icon$(docId, {
          type: 'lit',
          title,
          reference: referenced,
          referenceToNode: referenceToNode({ pageId: docId, params }),
        })
        .map(iconBuilder);

      const { signal: iconSignal, cleanup } = createSignalFromObservable(
        icon$,
        iconBuilder(referenced ? LinkedPageIcon : PageIcon)
      );

      this.disposables.push(cleanup);

      return iconSignal;
    }

    title(
      docId: string,
      { title, referenced }: DocDisplayMetaParams = {}
    ): Signal<string> {
      const title$ = docDisplayMetaService.title$(docId, {
        title,
        reference: referenced,
      });

      const { signal: titleSignal, cleanup } =
        createSignalFromObservable<string>(title$, title ?? '');

      this.disposables.push(cleanup);

      return titleSignal;
    }

    override unmounted() {
      this.dispose();
    }
  }

  return AffineDocDisplayMetaService;
}
