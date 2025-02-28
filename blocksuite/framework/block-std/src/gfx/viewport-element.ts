import { WithDisposable } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';

import { PropTypes, requiredProperties } from '../view/decorators/required.js';
import {
  type BlockComponent,
  type EditorHost,
  ShadowlessElement,
} from '../view/index.js';
import type { GfxBlockElementModel } from './model/gfx-block-model.js';
import { Viewport } from './viewport.js';

/**
 * A wrapper around `requestConnectedFrame` that only calls at most once in one frame
 */
export function requestThrottledConnectedFrame<
  T extends (...args: unknown[]) => void,
>(func: T, element?: HTMLElement): T {
  let raqId: number | undefined = undefined;
  let latestArgs: unknown[] = [];

  return ((...args: unknown[]) => {
    latestArgs = args;

    if (raqId === undefined) {
      raqId = requestAnimationFrame(() => {
        raqId = undefined;

        if (!element || element.isConnected) {
          func(...latestArgs);
        }
      });
    }
  }) as T;
}

function setDisplay(view: BlockComponent | null, display: 'block' | 'none') {
  if (!view) return;
  if (view.style.display !== display) {
    view.style.display = display;
  }
}

@requiredProperties({
  viewport: PropTypes.instanceOf(Viewport),
})
export class GfxViewportElement extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    gfx-viewport {
      position: absolute;
      left: 0;
      top: 0;
      contain: size layout style;
      display: block;
      transform: none;
    }
  `;

  optimizedBlocks = new Set<string>();

  private readonly _hideOutsideBlock = () => {
    if (!this.host) return;

    const { host, optimizedBlocks, enableOptimization } = this;
    const modelsInViewport = this.getModelsInViewport();
    modelsInViewport.forEach(model => {
      const view = host.std.view.getBlock(model.id);
      const canOptimize = optimizedBlocks.has(model.id) && enableOptimization;
      const display = canOptimize ? 'none' : 'block';
      setDisplay(view, display);

      if (this._lastVisibleModels?.has(model)) {
        this._lastVisibleModels!.delete(model);
      }
    });

    this._lastVisibleModels?.forEach(model => {
      const view = host.std.view.getBlock(model.id);
      setDisplay(view, 'none');
    });

    this._lastVisibleModels = modelsInViewport;
  };

  private _lastVisibleModels?: Set<GfxBlockElementModel>;

  private readonly _pendingChildrenUpdates: {
    id: string;
    resolve: () => void;
  }[] = [];

  private readonly _refreshViewport = requestThrottledConnectedFrame(() => {
    this._hideOutsideBlock();
  }, this);

  private _updatingChildrenFlag = false;

  renderingBlocks = new Set<string>();

  override connectedCallback(): void {
    super.connectedCallback();

    const viewportUpdateCallback = () => {
      this._refreshViewport();
    };

    if (!this.enableChildrenSchedule) {
      delete this.scheduleUpdateChildren;
    }

    this._hideOutsideBlock();
    this.disposables.add(
      this.viewport.viewportUpdated.on(() => viewportUpdateCallback())
    );
    this.disposables.add(
      this.viewport.sizeUpdated.on(() => viewportUpdateCallback())
    );
  }

  override render() {
    return html``;
  }

  scheduleUpdateChildren? = (id: string) => {
    const { promise, resolve } = Promise.withResolvers<void>();

    this._pendingChildrenUpdates.push({ id, resolve });

    if (!this._updatingChildrenFlag) {
      this._updatingChildrenFlag = true;
      const schedule = () => {
        if (this._pendingChildrenUpdates.length) {
          const childToUpdates = this._pendingChildrenUpdates.splice(
            0,
            this.maxConcurrentRenders
          );

          childToUpdates.forEach(({ resolve }) => resolve());

          if (this._pendingChildrenUpdates.length) {
            requestAnimationFrame(() => {
              this.isConnected && schedule();
            });
          } else {
            this._updatingChildrenFlag = false;
          }
        }
      };

      requestAnimationFrame(() => {
        this.isConnected && schedule();
      });
    }

    return promise;
  };

  @property({ attribute: false })
  accessor getModelsInViewport: () => Set<GfxBlockElementModel> = () =>
    new Set();

  @property({ attribute: false })
  accessor host: undefined | EditorHost;

  @property({ type: Number })
  accessor maxConcurrentRenders: number = 2;

  @property({ attribute: false })
  accessor enableChildrenSchedule: boolean = true;

  @property({ attribute: false })
  accessor viewport!: Viewport;

  @property({ attribute: false })
  accessor enableOptimization: boolean = false;

  updateOptimizedBlocks(blockIds: string[], optimized: boolean): void {
    let changed = false;

    blockIds.forEach(id => {
      if (optimized && !this.optimizedBlocks.has(id)) {
        this.optimizedBlocks.add(id);
        changed = true;
      } else if (!optimized && this.optimizedBlocks.has(id)) {
        this.optimizedBlocks.delete(id);
        changed = true;
      }
    });

    if (changed) this._refreshViewport();
  }

  clearOptimizedBlocks(): void {
    if (this.optimizedBlocks.size === 0) return;
    this.optimizedBlocks.clear();
    this._refreshViewport();
  }
}
