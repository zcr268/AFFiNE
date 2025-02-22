import type { SurfaceBlockModel } from '@blocksuite/affine-block-surface';
import type { BlockStdScope } from '@blocksuite/block-std';
import { isGfxGroupCompatibleModel } from '@blocksuite/block-std/gfx';
import type { TransformerMiddleware } from '@blocksuite/store';

/**
 * Used to filter out gfx elements that are not selected
 * @param ids
 * @param std
 * @returns
 */
export const gfxBlocksFilter = (
  ids: string[],
  std: BlockStdScope
): TransformerMiddleware => {
  const selectedIds = new Set<string>();
  const store = std.store;
  const surface = store.getBlocksByFlavour('affine:surface')[0]
    .model as SurfaceBlockModel;
  const idsToCheck = ids.slice();

  for (const id of idsToCheck) {
    const blockOrElem = store.getBlock(id)?.model ?? surface.getElementById(id);

    if (!blockOrElem) continue;

    if (isGfxGroupCompatibleModel(blockOrElem)) {
      idsToCheck.push(...blockOrElem.childIds);
    }

    selectedIds.add(id);
  }

  return ({ slots, transformerConfigs }) => {
    slots.beforeExport.on(payload => {
      if (payload.type !== 'block') {
        return;
      }

      if (payload.model.flavour === 'affine:surface') {
        transformerConfigs.set('selectedElements', selectedIds);
        payload.model.children = payload.model.children.filter(model =>
          selectedIds.has(model.id)
        );
        return;
      }
    });
  };
};
