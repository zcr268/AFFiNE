import type { BlockModel } from './block-model.js';

type PropsInDraft = 'version' | 'flavour' | 'role' | 'id' | 'keys' | 'text';

type ModelProps<Model> = Model extends BlockModel<infer U> ? U : never;

const draftModelSymbol = Symbol('draftModel');

export type DraftModel<Model extends BlockModel = BlockModel> = Pick<
  Model,
  PropsInDraft
> & {
  children: DraftModel[];
} & ModelProps<Model> & {
    [draftModelSymbol]: true;
  };

export function toDraftModel<Model extends BlockModel = BlockModel>(
  origin: Model
): DraftModel<Model> {
  const { id, version, flavour, role, keys, text, children } = origin;

  const isFlatData = origin.schema.model.isFlatData;
  const props = origin.keys.reduce((acc, key) => {
    const target = isFlatData ? origin.props : origin;
    const value = target[key as keyof typeof target];
    return {
      ...acc,
      [key]: value,
    };
  }, {} as ModelProps<Model>);

  return {
    id,
    version,
    flavour,
    role,
    keys,
    text,
    children: children.map(toDraftModel),
    ...props,
  } as DraftModel<Model>;
}
