import { I18n } from '@affine/i18n';
import type {
  OpenDocConfig,
  OpenDocConfigItem,
} from '@blocksuite/affine/blocks';
import { OpenDocExtension } from '@blocksuite/affine/blocks';
import {
  CenterPeekIcon,
  ExpandFullIcon,
  OpenInNewIcon,
  SplitViewIcon,
} from '@blocksuite/icons/lit';

export function patchOpenDocExtension() {
  const openDocConfig: OpenDocConfig = {
    items: [
      {
        type: 'open-in-active-view',
        label: I18n['com.affine.peek-view-controls.open-doc'](),
        icon: ExpandFullIcon(),
      },
      BUILD_CONFIG.isElectron
        ? {
            type: 'open-in-new-view',
            label:
              I18n['com.affine.peek-view-controls.open-doc-in-split-view'](),
            icon: SplitViewIcon(),
          }
        : null,
      {
        type: 'open-in-new-tab',
        label: I18n['com.affine.peek-view-controls.open-doc-in-new-tab'](),
        icon: OpenInNewIcon(),
      },
      {
        type: 'open-in-center-peek',
        label: I18n['com.affine.peek-view-controls.open-doc-in-center-peek'](),
        icon: CenterPeekIcon(),
      },
    ].filter((item): item is OpenDocConfigItem => item !== null),
  };
  return OpenDocExtension(openDocConfig);
}
