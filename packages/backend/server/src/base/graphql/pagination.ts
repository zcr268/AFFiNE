import { PipeTransform, Type } from '@nestjs/common';
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@InputType()
export class PaginationInput {
  /**
   * Because there is no resolver for GraphQL's InputTypes, we can't automatically decode the cursor input from base64 values.
   * Use this helper as `PipeTransform` to transform input args
   *
   * @example
   *
   * paginate(@Args('input', PaginationInput.decode) PaginationInput) {}
   */
  static decode: PipeTransform<PaginationInput, PaginationInput> = {
    transform: value => {
      return {
        ...value,
        after: value.after ? decode(value.after) : null,
        // before: value.before ? decode(value.before) : null,
      };
    },
  };

  @Field(() => Int, {
    nullable: true,
    description: 'returns the first n elements from the list.',
    defaultValue: 10,
  })
  first!: number;

  @Field(() => Int, {
    nullable: true,
    description: 'ignore the first n elements from the list.',
    defaultValue: 0,
  })
  offset!: number;

  @Field(() => String, {
    nullable: true,
    description:
      'returns the elements in the list that come after the specified cursor.',
  })
  after?: string | null;

  // NOT IMPLEMENTED YET
  // @Field(() => String, {
  //   nullable: true,
  //   description:
  //     'returns the elements in the list that come before the specified cursor.',
  // })
  // before?: string | null;
}

const encode = (input: string) => Buffer.from(input).toString('base64');
const decode = (base64String: string) =>
  Buffer.from(base64String, 'base64').toString('utf-8');

export function paginate<T>(
  list: T[],
  cursorField: keyof T,
  paginationInput: PaginationInput,
  total: number
): PaginatedType<T> {
  const edges = list.map(item => ({
    node: item,
    cursor: encode(String(item[cursorField])),
  }));

  return {
    totalCount: total,
    edges,
    pageInfo: {
      hasNextPage: edges.length >= paginationInput.first,
      hasPreviousPage: !!paginationInput.after || paginationInput.offset > 0,
      endCursor: edges.length ? edges[edges.length - 1].cursor : null,
      startCursor: edges.length ? edges[0].cursor : null,
    },
  };
}

export interface PaginatedType<T> {
  totalCount: number;
  edges: {
    cursor: string;
    node: T;
  }[];
  pageInfo: PageInfo;
}

@ObjectType()
export class PageInfo {
  @Field(() => String, { nullable: true })
  startCursor?: string | null;

  @Field(() => String, { nullable: true })
  endCursor?: string | null;

  @Field()
  hasNextPage!: boolean;

  @Field()
  hasPreviousPage!: boolean;
}

export function Paginated<T>(classRef: Type<T>): any {
  @ObjectType(`${classRef.name}Edge`)
  abstract class EdgeType {
    @Field(() => String)
    cursor!: string;

    @Field(() => classRef)
    node!: T;
  }

  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => Int)
    totalCount!: number;

    @Field(() => [EdgeType])
    edges!: EdgeType[];

    @Field(() => PageInfo)
    pageInfo!: PageInfo;
  }

  return PaginatedType;
}
