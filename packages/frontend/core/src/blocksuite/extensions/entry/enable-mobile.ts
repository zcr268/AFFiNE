import { VirtualKeyboardProvider } from '@affine/core/mobile/modules/virtual-keyboard';
import {
  type BlockStdScope,
  ConfigIdentifier,
  LifeCycleWatcher,
  LifeCycleWatcherIdentifier,
} from '@blocksuite/affine/block-std';
import type {
  CodeBlockConfig,
  ReferenceNodeConfig,
  SpecBuilder,
} from '@blocksuite/affine/blocks';
import {
  codeToolbarWidget,
  DocModeProvider,
  embedCardToolbarWidget,
  FeatureFlagService,
  formatBarWidget,
  imageToolbarWidget,
  ParagraphBlockService,
  ReferenceNodeConfigIdentifier,
  slashMenuWidget,
  surfaceRefToolbarWidget,
  VirtualKeyboardProvider as BSVirtualKeyboardProvider,
} from '@blocksuite/affine/blocks';
import type {
  Container,
  ServiceIdentifier,
} from '@blocksuite/affine/global/di';
import { DisposableGroup } from '@blocksuite/affine/global/utils';
import type { ExtensionType } from '@blocksuite/affine/store';
import { batch, signal } from '@preact/signals-core';
import type { FrameworkProvider } from '@toeverything/infra';

class MobileSpecsPatches extends LifeCycleWatcher {
  static override key = 'mobile-patches';

  constructor(std: BlockStdScope) {
    super(std);
    const featureFlagService = std.get(FeatureFlagService);

    featureFlagService.setFlag('enable_mobile_keyboard_toolbar', true);
    featureFlagService.setFlag('enable_mobile_linked_doc_menu', true);
  }

  static override setup(di: Container) {
    super.setup(di);

    // Hide reference popup on mobile.
    {
      const prev = di.getFactory(ReferenceNodeConfigIdentifier);
      di.override(ReferenceNodeConfigIdentifier, provider => {
        return {
          ...prev?.(provider),
          hidePopup: true,
        } satisfies ReferenceNodeConfig;
      });
    }

    // Hide number lines for code block on mobile.
    {
      const codeConfigIdentifier = ConfigIdentifier('affine:code');
      const prev = di.getFactory(codeConfigIdentifier);
      di.override(codeConfigIdentifier, provider => {
        return {
          ...prev?.(provider),
          showLineNumbers: false,
        } satisfies CodeBlockConfig;
      });
    }
  }

  override mounted() {
    // remove slash placeholder for mobile: `type / ...`
    {
      const paragraphService = this.std.get(ParagraphBlockService);
      if (!paragraphService) return;

      paragraphService.placeholderGenerator = model => {
        const placeholders = {
          text: '',
          h1: 'Heading 1',
          h2: 'Heading 2',
          h3: 'Heading 3',
          h4: 'Heading 4',
          h5: 'Heading 5',
          h6: 'Heading 6',
          quote: '',
        };
        return placeholders[model.type];
      };
    }
  }
}

function KeyboardToolbarExtension(framework: FrameworkProvider): ExtensionType {
  const affineVirtualKeyboardProvider = framework.get(VirtualKeyboardProvider);

  class BSVirtualKeyboardService
    extends LifeCycleWatcher
    implements BSVirtualKeyboardProvider
  {
    static override key = BSVirtualKeyboardProvider.identifierName;

    private readonly _disposables = new DisposableGroup();

    private get _rootContentEditable() {
      const editorMode = this.std.get(DocModeProvider).getEditorMode();
      if (editorMode !== 'page') return null;

      if (!this.std.host.doc.root) return;
      return this.std.view.getBlock(this.std.host.doc.root.id);
    }

    // eslint-disable-next-line rxjs/finnish
    readonly visible$ = signal(false);

    // eslint-disable-next-line rxjs/finnish
    readonly height$ = signal(0);

    show() {
      if ('show' in affineVirtualKeyboardProvider) {
        affineVirtualKeyboardProvider.show();
      } else if (this._rootContentEditable) {
        this._rootContentEditable.inputMode = '';
      }
    }
    hide() {
      if ('hide' in affineVirtualKeyboardProvider) {
        affineVirtualKeyboardProvider.hide();
      } else if (this._rootContentEditable) {
        this._rootContentEditable.inputMode = 'none';
      }
    }

    static override setup(di: Container) {
      super.setup(di);
      di.addImpl(BSVirtualKeyboardProvider, provider => {
        return provider.get(
          LifeCycleWatcherIdentifier(
            this.key
          ) as ServiceIdentifier<BSVirtualKeyboardService>
        );
      });
    }

    override mounted() {
      this._disposables.add(
        affineVirtualKeyboardProvider.onChange(({ visible, height }) => {
          batch(() => {
            this.visible$.value = visible;
            this.height$.value = height;
          });
        })
      );
    }

    override unmounted() {
      this._disposables.dispose();
    }
  }

  return BSVirtualKeyboardService;
}

export function enableMobileExtension(
  specBuilder: SpecBuilder,
  framework: FrameworkProvider
): void {
  specBuilder.omit(formatBarWidget);
  specBuilder.omit(embedCardToolbarWidget);
  specBuilder.omit(slashMenuWidget);
  specBuilder.omit(codeToolbarWidget);
  specBuilder.omit(imageToolbarWidget);
  specBuilder.omit(surfaceRefToolbarWidget);
  specBuilder.extend([MobileSpecsPatches, KeyboardToolbarExtension(framework)]);
}
