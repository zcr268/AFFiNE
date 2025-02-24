import type { DocMeta, TransformerMiddleware } from '@blocksuite/store';

export const titleMiddleware =
  (metas: DocMeta[]): TransformerMiddleware =>
  ({ slots, adapterConfigs }) => {
    slots.beforeExport.on(() => {
      for (const meta of metas) {
        adapterConfigs.set('title:' + meta.id, meta.title);
      }
    });
  };
