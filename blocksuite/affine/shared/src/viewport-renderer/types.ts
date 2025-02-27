export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// We can't use viewport instance here because it can't be reused in worker
export interface ViewportState {
  zoom: number;
  viewScale: number;
  viewportX: number;
  viewportY: number;
}

export interface SentenceLayout {
  text: string;
  rects: TextRect[];
}

export interface ParagraphLayout {
  sentences: SentenceLayout[];
  zoom: number;
}

export interface ViewportLayout {
  paragraphs: ParagraphLayout[];
  rect: Rect;
}

export interface TextRect {
  rect: Rect;
  text: string;
}

/**
 * Represents the rendering state of the ViewportTurboRenderer
 * - inactive: Renderer is not active
 * - pending: Bitmap is invalid or not yet available, falling back to DOM rendering
 * - rendering: Currently rendering to a bitmap (async operation in progress)
 * - ready: Bitmap is valid and rendered, DOM elements can be safely removed
 */
export type RenderingState = 'inactive' | 'pending' | 'rendering' | 'ready';
