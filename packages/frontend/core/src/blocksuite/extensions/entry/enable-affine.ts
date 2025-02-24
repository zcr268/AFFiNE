import type { SpecBuilder } from '@blocksuite/affine/blocks';
import { type FrameworkProvider } from '@toeverything/infra';

import { buildDocDisplayMetaExtension } from '../display-meta';
import { getEditorConfigExtension } from '../editor-config';
import { getFontConfigExtension } from '../font-config';
import { getTelemetryExtension } from '../telemetry';
import { getThemeExtension } from '../theme';

export function enableAffineExtension(
  specBuilder: SpecBuilder,
  framework: FrameworkProvider
): void {
  specBuilder.extend(
    [
      getThemeExtension(framework),
      getFontConfigExtension(),
      getTelemetryExtension(),
      getEditorConfigExtension(framework),
      buildDocDisplayMetaExtension(framework),
    ].flat()
  );
}
