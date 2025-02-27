import { AIChatBlockSchema } from '@affine/core/blocksuite/ai/blocks';
import { LifeCycleWatcher } from '@blocksuite/affine/block-std';
import { EdgelessRootBlockComponent } from '@blocksuite/affine/blocks';
import type { BlockSnapshot } from '@blocksuite/affine/store';

export class EdgelessClipboardWatcher extends LifeCycleWatcher {
  static override key = 'edgeless-clipboard-watcher';

  override mounted() {
    super.mounted();
    const { view } = this.std;
    view.viewUpdated.on(payload => {
      if (payload.type !== 'block' || payload.method !== 'add') {
        return;
      }
      const component = payload.view;
      if (!(component instanceof EdgelessRootBlockComponent)) {
        return;
      }
      const AIChatBlockFlavour = AIChatBlockSchema.model.flavour;
      const createFunc = (block: BlockSnapshot) => {
        const { xywh, scale, messages, sessionId, rootDocId, rootWorkspaceId } =
          block.props;
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
    });
  }
}
