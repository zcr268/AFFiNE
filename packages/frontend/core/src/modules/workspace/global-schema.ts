import { AIChatBlockSchema } from '@affine/core/blocksuite/ai/blocks/ai-chat-block/model';
import { AffineSchemas } from '@blocksuite/affine/blocks/schemas';
import { Schema } from '@blocksuite/affine/store';

let _schema: Schema | null = null;
export function getAFFiNEWorkspaceSchema() {
  if (!_schema) {
    _schema = new Schema();

    _schema.register([...AffineSchemas, AIChatBlockSchema]);
  }

  return _schema;
}
