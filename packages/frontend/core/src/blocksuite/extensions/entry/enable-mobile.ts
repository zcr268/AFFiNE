import { createKeyboardToolbarConfig } from '@affine/core/blocksuite/extensions/keyboard-toolbar-config';
import {
  type BlockStdScope,
  ConfigIdentifier,
  LifeCycleWatcher,
} from '@blocksuite/affine/block-std';
import type {
  CodeBlockConfig,
  ReferenceNodeConfig,
  RootBlockConfig,
  SpecBuilder,
} from '@blocksuite/affine/blocks';
import {
  codeToolbarWidget,
  embedCardToolbarWidget,
  FeatureFlagService,
  formatBarWidget,
  imageToolbarWidget,
  ParagraphBlockService,
  ReferenceNodeConfigIdentifier,
  RootBlockConfigExtension,
  slashMenuWidget,
  surfaceRefToolbarWidget,
} from '@blocksuite/affine/blocks';
import type { Container } from '@blocksuite/affine/global/di';
import type { ExtensionType } from '@blocksuite/affine/store';

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

const mobileExtensions: ExtensionType[] = [
  {
    setup: di => {
      const prev = di.getFactory(RootBlockConfigExtension.identifier);

      di.override(RootBlockConfigExtension.identifier, provider => {
        return {
          ...prev?.(provider),
          keyboardToolbar: createKeyboardToolbarConfig(),
        } satisfies RootBlockConfig;
      });
    },
  },
  MobileSpecsPatches,
];

export function enableMobileExtension(specBuilder: SpecBuilder): void {
  specBuilder.omit(formatBarWidget);
  specBuilder.omit(embedCardToolbarWidget);
  specBuilder.omit(slashMenuWidget);
  specBuilder.omit(codeToolbarWidget);
  specBuilder.omit(imageToolbarWidget);
  specBuilder.omit(surfaceRefToolbarWidget);
  specBuilder.extend(mobileExtensions);
}
