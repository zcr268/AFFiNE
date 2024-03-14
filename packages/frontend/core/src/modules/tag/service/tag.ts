import { LiveData, type PageRecordList } from '@toeverything/infra';
import { nanoid } from 'nanoid';

import type { WorkspaceLegacyProperties } from '../../workspace';
import { Tag } from '../entities/tag';

export class TagService {
  constructor(
    private readonly properties: WorkspaceLegacyProperties,
    private readonly pageRecordList: PageRecordList
  ) {}

  readonly tags = this.properties.tagOptions$.map(tags =>
    tags.map(tag => new Tag(tag.id, this.properties, this.pageRecordList))
  );

  createTag(value: string, color: string) {
    const newId = nanoid();
    this.properties.updateTagOptions([
      ...this.properties.tagOptions$.value,
      {
        id: newId,
        value,
        color,
        createDate: Date.now(),
        updateDate: Date.now(),
      },
    ]);
  }

  deleteTag(tagId: string) {
    this.properties.removeTagOption(tagId);
  }

  tagsByPageId(pageId: string) {
    return LiveData.computed(get => {
      const pageRecord = get(this.pageRecordList.record(pageId));
      if (!pageRecord) return [];
      const tagIds = get(pageRecord.meta).tags;

      return get(this.tags).filter(tag => tagIds.includes(tag.id));
    });
  }

  tagByTagId(tagId?: string) {
    return LiveData.computed(get => {
      return get(this.tags).find(tag => tag.id === tagId);
    });
  }

  tagMetas = LiveData.computed(get => {
    return get(this.tags).map(tag => {
      return {
        id: tag.id,
        title: get(tag.value),
        color: get(tag.color),
        pageCount: get(tag.pageIds).length,
        createDate: get(tag.createDate),
        updatedDate: get(tag.updateDate),
      };
    });
  });
}
