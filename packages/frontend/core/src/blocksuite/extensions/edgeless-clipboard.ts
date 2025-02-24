import { AIChatBlockSchema } from '@affine/core/blocksuite/ai/blocks';
import { BlockServiceWatcher } from '@blocksuite/affine/block-std';
import { EdgelessRootBlockComponent } from '@blocksuite/affine/blocks';
import type { BlockSnapshot } from '@blocksuite/affine/store';

export class EdgelessClipboardWatcher extends BlockServiceWatcher {
  static override readonly flavour = 'affine:page';

  override mounted() {
    super.mounted();
    this.blockService.disposables.add(
      this.blockService.specSlots.viewConnected.on(view => {
        const { component } = view;
        if (component instanceof EdgelessRootBlockComponent) {
          const AIChatBlockFlavour = AIChatBlockSchema.model.flavour;
          const createFunc = (block: BlockSnapshot) => {
            const {
              xywh,
              scale,
              messages,
              sessionId,
              rootDocId,
              rootWorkspaceId,
            } = block.props;
            const blockId = component.service.crud.addBlock(
              AIChatBlockFlavour,
              {
                xywh,
                scale,
                messages,
                sessionId,
                rootDocId,
                rootWorkspaceId,
              },
              component.surface.model.id
            );
            return blockId;
          };
          component.clipboardController.registerBlock(
            AIChatBlockFlavour,
            createFunc
          );
        }
      })
    );
  }
}
