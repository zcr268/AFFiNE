import { enableAIExtension } from '@affine/core/blocksuite/ai';
import { enableAffineExtension } from '@affine/core/blocksuite/extensions';
import type { SpecBuilder } from '@blocksuite/affine/blocks';
import { SpecProvider } from '@blocksuite/affine/blocks';
import { type FrameworkProvider } from '@toeverything/infra';

export function enableEditorExtension(
  framework: FrameworkProvider,
  mode: 'edgeless' | 'page',
  enableAI: boolean
): SpecBuilder {
  const spec = SpecProvider._.getSpec(mode);
  enableAffineExtension(spec, framework);
  enableAIExtension(spec, framework, enableAI);

  return spec;
}
