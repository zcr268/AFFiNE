import { type ViewportLayout } from './types.js';

type WorkerMessagePaint = {
  type: 'paintLayout';
  data: {
    layout: ViewportLayout;
    width: number;
    height: number;
    dpr: number;
    zoom: number;
  };
};

type WorkerMessage = WorkerMessagePaint;

const meta = {
  emSize: 2048,
  hHeadAscent: 1984,
  hHeadDescent: -494,
};

const font = new FontFace(
  'Inter',
  `url(https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwYZ8UA3.woff2)`
);
// @ts-expect-error worker env
self.fonts && self.fonts.add(font);

function getBaseline() {
  const fontSize = 15;
  const lineHeight = 1.2 * fontSize;

  const A = fontSize * (meta.hHeadAscent / meta.emSize); // ascent
  const D = fontSize * (meta.hHeadDescent / meta.emSize); // descent
  const AD = A + Math.abs(D); // ascent + descent
  const L = lineHeight - AD; // leading
  const y = A + L / 2;
  return y;
}

/** Layout painter in worker */
class LayoutPainter {
  private readonly canvas: OffscreenCanvas = new OffscreenCanvas(0, 0);
  private ctx: OffscreenCanvasRenderingContext2D | null = null;
  private zoom = 1;

  setSize(layoutRectW: number, layoutRectH: number, dpr: number, zoom: number) {
    const width = layoutRectW * dpr * zoom;
    const height = layoutRectH * dpr * zoom;

    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.scale(dpr, dpr);
    this.zoom = zoom;
    this.clearBackground();
  }

  private clearBackground() {
    if (!this.canvas || !this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  paint(layout: ViewportLayout) {
    const { canvas, ctx } = this;
    if (!canvas || !ctx) return;
    if (layout.rect.w === 0 || layout.rect.h === 0) {
      console.warn('empty layout rect');
      return;
    }

    this.clearBackground();

    ctx.scale(this.zoom, this.zoom);

    // Track rendered positions to avoid duplicate rendering across all paragraphs and sentences
    const renderedPositions = new Set<string>();

    layout.paragraphs.forEach(paragraph => {
      const fontSize = 15;
      ctx.font = `300 ${fontSize}px Inter`;
      const baselineY = getBaseline();

      paragraph.sentences.forEach(sentence => {
        ctx.strokeStyle = 'yellow';
        sentence.rects.forEach(textRect => {
          const x = textRect.rect.x - layout.rect.x;
          const y = textRect.rect.y - layout.rect.y;

          const posKey = `${x},${y}`;
          // Only render if we haven't rendered at this position before
          if (renderedPositions.has(posKey)) return;

          ctx.strokeRect(x, y, textRect.rect.w, textRect.rect.h);
          ctx.fillStyle = 'black';
          ctx.fillText(textRect.text, x, y + baselineY);

          renderedPositions.add(posKey);
        });
      });
    });

    const bitmap = canvas.transferToImageBitmap();
    self.postMessage({ type: 'bitmapPainted', bitmap }, { transfer: [bitmap] });
  }
}

const painter = new LayoutPainter();
let fontLoaded = false;

font
  .load()
  .then(() => {
    fontLoaded = true;
  })
  .catch(console.error);

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, data } = e.data;

  if (!fontLoaded) {
    await font.load();
    fontLoaded = true;
  }

  switch (type) {
    case 'paintLayout': {
      const { layout, width, height, dpr, zoom } = data;
      painter.setSize(width, height, dpr, zoom);
      painter.paint(layout);
      break;
    }
  }
};
