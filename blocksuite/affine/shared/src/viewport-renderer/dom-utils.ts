import {
  GfxControllerIdentifier,
  type Viewport,
} from '@blocksuite/block-std/gfx';
import { Pane } from 'tweakpane';

import { getSentenceRects, segmentSentences } from './text-utils.js';
import type { ParagraphLayout, ViewportLayout } from './types.js';
import type { ViewportTurboRendererExtension } from './viewport-renderer.js';

export function syncCanvasSize(canvas: HTMLCanvasElement, host: HTMLElement) {
  const hostRect = host.getBoundingClientRect();
  const dpr = window.devicePixelRatio;
  canvas.style.position = 'absolute';
  canvas.style.left = '0px';
  canvas.style.top = '0px';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.width = hostRect.width * dpr;
  canvas.height = hostRect.height * dpr;
  canvas.style.pointerEvents = 'none';
}

export function getViewportLayout(
  host: HTMLElement,
  viewport: Viewport
): ViewportLayout {
  const paragraphBlocks = host.querySelectorAll(
    '.affine-paragraph-rich-text-wrapper [data-v-text="true"]'
  );

  const zoom = viewport.zoom;

  let layoutMinX = Infinity;
  let layoutMinY = Infinity;
  let layoutMaxX = -Infinity;
  let layoutMaxY = -Infinity;

  const paragraphs: ParagraphLayout[] = Array.from(paragraphBlocks).map(p => {
    const sentences = segmentSentences(p.textContent || '');
    const sentenceLayouts = sentences.map(sentence => {
      const rects = getSentenceRects(p, sentence);
      rects.forEach(({ rect }) => {
        layoutMinX = Math.min(layoutMinX, rect.x);
        layoutMinY = Math.min(layoutMinY, rect.y);
        layoutMaxX = Math.max(layoutMaxX, rect.x + rect.w);
        layoutMaxY = Math.max(layoutMaxY, rect.y + rect.h);
      });
      return {
        text: sentence,
        rects: rects.map(rect => {
          const [x, y] = viewport.toModelCoordFromClientCoord([
            rect.rect.x,
            rect.rect.y,
          ]);
          return {
            ...rect,
            rect: {
              x,
              y,
              w: rect.rect.w / zoom / viewport.viewScale,
              h: rect.rect.h / zoom / viewport.viewScale,
            },
          };
        }),
      };
    });

    return {
      sentences: sentenceLayouts,
      zoom,
    };
  });

  const layoutModelCoord = viewport.toModelCoordFromClientCoord([
    layoutMinX,
    layoutMinY,
  ]);
  const w = (layoutMaxX - layoutMinX) / zoom / viewport.viewScale;
  const h = (layoutMaxY - layoutMinY) / zoom / viewport.viewScale;
  const layout: ViewportLayout = {
    paragraphs,
    rect: {
      x: layoutModelCoord[0],
      y: layoutModelCoord[1],
      w: Math.max(w, 0),
      h: Math.max(h, 0),
    },
  };
  return layout;
}

export function initTweakpane(
  renderer: ViewportTurboRendererExtension,
  viewportElement: HTMLElement
) {
  const debugPane = new Pane({ container: viewportElement });
  const paneElement = debugPane.element;
  paneElement.style.position = 'absolute';
  paneElement.style.top = '10px';
  paneElement.style.right = '10px';
  paneElement.style.width = '250px';
  debugPane.title = 'Viewport Turbo Renderer';

  debugPane
    .addBinding({ paused: false }, 'paused', {
      label: 'Paused',
    })
    .on('change', ({ value }) => {
      renderer.state = value ? 'paused' : 'monitoring';
    });

  debugPane
    .addBinding({ keepDOM: true }, 'keepDOM', {
      label: 'Keep DOM',
    })
    .on('change', ({ value }) => {
      const container = viewportElement.querySelector('gfx-viewport')!;
      (container as HTMLElement).style.display = value ? 'block' : 'none';
    });

  debugPane.addButton({ title: 'Fit Viewport' }).on('click', () => {
    const gfx = renderer.std.get(GfxControllerIdentifier);
    gfx.fitToScreen();
  });

  debugPane.addButton({ title: 'Force Refresh' }).on('click', () => {
    renderer.refresh(true).catch(console.error);
  });
}
