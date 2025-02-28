import { registerAIEffects } from '@affine/core/blocksuite/ai/effects';
import { editorEffects } from '@affine/core/blocksuite/editors';
import { effects as bsEffects } from '@blocksuite/affine/effects';

import { registerTemplates } from './register-templates';

bsEffects();
editorEffects();
registerAIEffects();
registerTemplates();

export * from './blocksuite-editor';
export * from './blocksuite-editor-container';
