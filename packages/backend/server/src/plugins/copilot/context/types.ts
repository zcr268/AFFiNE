import { z } from 'zod';

declare global {
  interface Events {
    'workspace.doc.embedding': {
      workspaceId: string;
      docId: string;
    };
  }
}

export enum ContextFileStatus {
  processing = 'processing',
  finished = 'finished',
  failed = 'failed',
}

export const ContextConfigSchema = z.object({
  workspaceId: z.string(),
  files: z
    .object({
      id: z.string(),
      chunkSize: z.number(),
      name: z.string(),
      status: z.enum([
        ContextFileStatus.processing,
        ContextFileStatus.finished,
        ContextFileStatus.failed,
      ]),
      blobId: z.string(),
      createdAt: z.number(),
    })
    .array(),
  docs: z
    .object({
      id: z.string(),
      createdAt: z.number(),
    })
    .array(),
});

export type ContextConfig = z.infer<typeof ContextConfigSchema>;
export type ContextDoc = z.infer<typeof ContextConfigSchema>['docs'][number];
export type ContextFile = z.infer<typeof ContextConfigSchema>['files'][number];
export type ContextListItem = ContextDoc | ContextFile;
export type ContextList = ContextListItem[];

export type ChunkSimilarity = {
  chunk: number;
  content: string;
  distance: number | null;
};

export type FileChunkSimilarity = ChunkSimilarity & {
  fileId: string;
};

export type DocChunkSimilarity = ChunkSimilarity & {
  docId: string;
};

export type Embedding = {
  /**
   * The index of the embedding in the list of embeddings.
   */
  index: number;
  content: string;
  embedding: Array<number>;
};
