import {
  type BlockStdScope,
  LifeCycleWatcher,
  LifeCycleWatcherIdentifier,
  StdIdentifier,
} from '@blocksuite/block-std';
import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import { type Container, type ServiceIdentifier } from '@blocksuite/global/di';
import { debounce, DisposableGroup } from '@blocksuite/global/utils';
import { type Pane } from 'tweakpane';

import {
  getViewportLayout,
  initTweakpane,
  syncCanvasSize,
} from './dom-utils.js';
import { type ViewportLayout } from './types.js';

export const ViewportTurboRendererIdentifier = LifeCycleWatcherIdentifier(
  'ViewportTurboRenderer'
) as ServiceIdentifier<ViewportTurboRendererExtension>;

interface Tile {
  bitmap: ImageBitmap;
  zoom: number;
}

// With high enough zoom, fallback to DOM rendering
const zoomThreshold = 1;

export class ViewportTurboRendererExtension extends LifeCycleWatcher {
  state: 'monitoring' | 'paused' = 'paused';
  disposables = new DisposableGroup();

  static override setup(di: Container) {
    di.addImpl(ViewportTurboRendererIdentifier, this, [StdIdentifier]);
  }

  public readonly canvas: HTMLCanvasElement = document.createElement('canvas');
  private readonly worker: Worker;
  private layoutCache: ViewportLayout | null = null;
  private tile: Tile | null = null;
  private debugPane: Pane | null = null;

  constructor(std: BlockStdScope) {
    super(std);
    this.worker = new Worker(new URL('./painter.worker.ts', import.meta.url), {
      type: 'module',
    });
  }

  override mounted() {
    const mountPoint = document.querySelector('.affine-edgeless-viewport');
    if (mountPoint) {
      mountPoint.append(this.canvas);
      initTweakpane(this, mountPoint as HTMLElement);
    }

    this.viewport.elementReady.once(() => {
      syncCanvasSize(this.canvas, this.std.host);
      this.state = 'monitoring';
      this.disposables.add(
        this.viewport.viewportUpdated.on(() => {
          this.refresh().catch(console.error);
        })
      );
    });

    const debouncedRefresh = debounce(
      () => {
        this.refresh().catch(console.error);
      },
      1000, // During this period, fallback to DOM
      { leading: false, trailing: true }
    );
    this.disposables.add(
      this.std.store.slots.blockUpdated.on(() => {
        this.invalidate();
        debouncedRefresh();
      })
    );
  }

  override unmounted() {
    this.clearTile();
    if (this.debugPane) {
      this.debugPane.dispose();
      this.debugPane = null;
    }
    this.worker.terminate();
    this.canvas.remove();
    this.disposables.dispose();
  }

  get viewport() {
    return this.std.get(GfxControllerIdentifier).viewport;
  }

  async refresh() {
    if (this.state === 'paused') return;

    this.clearCanvas();
    if (this.viewport.zoom > zoomThreshold) {
      return;
    } else if (this.canUseBitmapCache()) {
      this.drawCachedBitmap(this.layoutCache!);
    } else {
      if (!this.layoutCache) {
        this.updateLayoutCache();
      }
      const layout = this.layoutCache!;
      await this.paintLayout(layout);
      this.drawCachedBitmap(layout);
    }
  }

  invalidate() {
    this.layoutCache = null;
    this.clearTile();
    this.clearCanvas(); // Should clear immediately after content updates
  }

  private updateLayoutCache() {
    const layout = getViewportLayout(this.std.host, this.viewport);
    this.layoutCache = layout;
  }

  private clearTile() {
    if (this.tile) {
      this.tile.bitmap.close();
      this.tile = null;
    }
  }

  private async paintLayout(layout: ViewportLayout): Promise<void> {
    return new Promise(resolve => {
      if (!this.worker) return;

      const dpr = window.devicePixelRatio;
      this.worker.postMessage({
        type: 'paintLayout',
        data: {
          layout,
          width: layout.rect.w,
          height: layout.rect.h,
          dpr,
          zoom: this.viewport.zoom,
        },
      });

      this.worker.onmessage = (e: MessageEvent) => {
        if (e.data.type === 'bitmapPainted') {
          this.handlePaintedBitmap(e.data.bitmap, resolve);
        }
      };
    });
  }

  private handlePaintedBitmap(bitmap: ImageBitmap, resolve: () => void) {
    if (this.tile) {
      this.tile.bitmap.close();
    }
    this.tile = {
      bitmap,
      zoom: this.viewport.zoom,
    };
    resolve();
  }

  private canUseBitmapCache(): boolean {
    return (
      !!this.layoutCache && !!this.tile && this.viewport.zoom === this.tile.zoom
    );
  }

  private clearCanvas() {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawCachedBitmap(layout: ViewportLayout) {
    const bitmap = this.tile!.bitmap;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    this.clearCanvas();
    const layoutViewCoord = this.viewport.toViewCoord(
      layout.rect.x,
      layout.rect.y
    );

    ctx.drawImage(
      bitmap,
      layoutViewCoord[0] * window.devicePixelRatio,
      layoutViewCoord[1] * window.devicePixelRatio,
      layout.rect.w * window.devicePixelRatio * this.viewport.zoom,
      layout.rect.h * window.devicePixelRatio * this.viewport.zoom
    );
  }
}
