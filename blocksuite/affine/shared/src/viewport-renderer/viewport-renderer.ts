import {
  type BlockStdScope,
  LifeCycleWatcher,
  LifeCycleWatcherIdentifier,
  StdIdentifier,
} from '@blocksuite/block-std';
import {
  GfxControllerIdentifier,
  type GfxViewportElement,
} from '@blocksuite/block-std/gfx';
import type { Container, ServiceIdentifier } from '@blocksuite/global/di';
import { debounce, DisposableGroup } from '@blocksuite/global/utils';

import {
  debugLog,
  getViewportLayout,
  initTweakpane,
  syncCanvasSize,
} from './dom-utils.js';
import type { RenderingState, ViewportLayout } from './types.js';

export const ViewportTurboRendererIdentifier = LifeCycleWatcherIdentifier(
  'ViewportTurboRenderer'
) as ServiceIdentifier<ViewportTurboRendererExtension>;

interface Tile {
  bitmap: ImageBitmap;
  zoom: number;
}

const zoomThreshold = 1; // With high enough zoom, fallback to DOM rendering
const debounceTime = 1000; // During this period, fallback to DOM
const debug = false; // Toggle for debug logs

export class ViewportTurboRendererExtension extends LifeCycleWatcher {
  state: RenderingState = 'inactive';
  disposables = new DisposableGroup();
  private layoutVersion = 0;

  static override setup(di: Container) {
    di.addImpl(ViewportTurboRendererIdentifier, this, [StdIdentifier]);
  }

  public readonly canvas: HTMLCanvasElement = document.createElement('canvas');
  private readonly worker: Worker;
  private layoutCacheData: ViewportLayout | null = null;
  private tile: Tile | null = null;
  private viewportElement: GfxViewportElement | null = null;

  constructor(std: BlockStdScope) {
    super(std);
    this.worker = new Worker(new URL('./painter.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.debugLog('Initialized ViewportTurboRenderer');
  }

  override mounted() {
    const mountPoint = document.querySelector('.affine-edgeless-viewport');
    if (mountPoint) {
      mountPoint.append(this.canvas);
      initTweakpane(this, mountPoint as HTMLElement);
    }

    this.viewport.elementReady.once(element => {
      this.viewportElement = element;
      syncCanvasSize(this.canvas, this.std.host);
      this.setState('pending');

      this.disposables.add(
        this.viewport.sizeUpdated.on(() => this.handleResize())
      );
      this.disposables.add(
        this.viewport.viewportUpdated.on(() => {
          this.refresh().catch(console.error);
        })
      );
    });

    this.disposables.add(
      this.selection.slots.updated.on(() => this.invalidate())
    );
    this.disposables.add(
      this.std.store.slots.blockUpdated.on(() => this.invalidate())
    );
  }

  override unmounted() {
    this.debugLog('Unmounting renderer');
    this.clearTile();
    this.clearOptimizedBlocks();
    this.worker.terminate();
    this.canvas.remove();
    this.disposables.dispose();
    this.setState('inactive');
  }

  get gfx() {
    return this.std.get(GfxControllerIdentifier);
  }

  get viewport() {
    return this.gfx.viewport;
  }

  get selection() {
    return this.gfx.selection;
  }

  get layoutCache() {
    if (this.layoutCacheData) return this.layoutCacheData;
    const layout = getViewportLayout(this.std.host, this.viewport);
    this.debugLog('Layout cache updated');
    return (this.layoutCacheData = layout);
  }

  async refresh() {
    if (this.state === 'inactive') return;

    this.clearCanvas();
    // -> pending
    if (this.viewport.zoom > zoomThreshold) {
      this.debugLog('Zoom above threshold, falling back to DOM rendering');
      this.setState('pending');
      this.toggleOptimization(false);
      this.clearOptimizedBlocks();
    }
    // -> ready
    else if (this.canUseBitmapCache()) {
      this.debugLog('Using cached bitmap');
      this.setState('ready');
      this.drawCachedBitmap(this.layoutCache);
      this.updateOptimizedBlocks();
    }
    // -> rendering
    else {
      this.setState('rendering');
      this.toggleOptimization(false);
      await this.paintLayout(this.layoutCache);
      this.drawCachedBitmap(this.layoutCache);
      this.updateOptimizedBlocks();
    }
  }

  debouncedRefresh = debounce(
    () => {
      this.refresh().catch(console.error);
    },
    debounceTime,
    { leading: false, trailing: true }
  );

  invalidate() {
    this.layoutVersion++;
    this.layoutCacheData = null;
    this.clearTile();
    this.clearCanvas();
    this.clearOptimizedBlocks();
    this.setState('pending');
    this.debugLog(`Invalidated renderer (layoutVersion=${this.layoutVersion})`);
  }

  private debugLog(message: string) {
    if (!debug) return;
    debugLog(message, this.state);
  }

  private clearTile() {
    if (!this.tile) return;
    this.tile.bitmap.close();
    this.tile = null;
    this.debugLog('Tile cleared');
  }

  private async paintLayout(layout: ViewportLayout): Promise<void> {
    return new Promise(resolve => {
      if (!this.worker) return;

      const dpr = window.devicePixelRatio;
      const currentVersion = this.layoutVersion;

      this.debugLog(`Requesting bitmap painting (version=${currentVersion})`);
      this.worker.postMessage({
        type: 'paintLayout',
        data: {
          layout,
          width: layout.rect.w,
          height: layout.rect.h,
          dpr,
          zoom: this.viewport.zoom,
          version: currentVersion,
        },
      });

      this.worker.onmessage = (e: MessageEvent) => {
        if (e.data.type === 'bitmapPainted') {
          if (e.data.version === this.layoutVersion) {
            this.debugLog(
              `Bitmap painted successfully (version=${e.data.version})`
            );
            this.handlePaintedBitmap(e.data.bitmap, resolve);
          } else {
            this.debugLog(
              `Received outdated bitmap (got=${e.data.version}, current=${this.layoutVersion})`
            );
            e.data.bitmap.close();
            this.setState('pending');
            resolve();
          }
        }
      };
    });
  }

  private handlePaintedBitmap(bitmap: ImageBitmap, resolve: () => void) {
    this.clearTile();
    this.tile = {
      bitmap,
      zoom: this.viewport.zoom,
    };
    this.setState('ready');
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
    this.debugLog('Canvas cleared');
  }

  private drawCachedBitmap(layout: ViewportLayout) {
    if (!this.tile) {
      this.debugLog('No cached bitmap available, requesting refresh');
      this.debouncedRefresh();
      return;
    }

    const bitmap = this.tile.bitmap;
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

    this.debugLog('Bitmap drawn to canvas');
  }

  setState(newState: RenderingState) {
    if (this.state === newState) return;
    this.debugLog(`State change: ${this.state} -> ${newState}`);
    this.state = newState;
  }

  canOptimize(): boolean {
    const isReady = this.state === 'ready';
    const isBelowZoomThreshold = this.viewport.zoom <= zoomThreshold;
    const result = isReady && isBelowZoomThreshold;
    return result;
  }

  private updateOptimizedBlocks() {
    requestAnimationFrame(() => {
      if (!this.viewportElement || !this.layoutCache) return;
      if (!this.canOptimize()) return;
      if (this.state !== 'ready') {
        this.debugLog('Unexpected state updating optimized blocks');
        console.warn('Unexpected state', this.tile, this.layoutCache);
        return;
      }

      this.toggleOptimization(true);
      const blockElements = this.viewportElement.getModelsInViewport();
      const blockIds = Array.from(blockElements).map(model => model.id);
      this.viewportElement.updateOptimizedBlocks(blockIds, true);
      this.debugLog(`Optimized ${blockIds.length} blocks`);
    });
  }

  private clearOptimizedBlocks() {
    if (!this.viewportElement) return;
    this.viewportElement.clearOptimizedBlocks();
    this.debugLog('Cleared optimized blocks');
  }

  private toggleOptimization(value: boolean) {
    if (
      this.viewportElement &&
      this.viewportElement.enableOptimization !== value
    ) {
      this.viewportElement.enableOptimization = value;
      this.debugLog(`${value ? 'Enabled' : 'Disabled'} optimization`);
    }
  }

  private handleResize() {
    this.debugLog('Container resized, syncing canvas size');
    syncCanvasSize(this.canvas, this.std.host);
    this.invalidate();
    this.debouncedRefresh();
  }
}
