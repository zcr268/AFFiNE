import {
  WidgetComponent,
  WidgetViewExtension,
} from '@blocksuite/affine/block-std';
import { GfxControllerIdentifier } from '@blocksuite/affine/block-std/gfx';
import type { RootBlockModel } from '@blocksuite/affine/blocks';
import {
  EdgelessLegacySlotIdentifier,
  MOUSE_BUTTON,
  requestConnectedFrame,
} from '@blocksuite/affine/blocks';
import {
  Bound,
  getCommonBoundWithRotation,
} from '@blocksuite/affine/global/utils';
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  size,
} from '@floating-ui/dom';
import { effect } from '@preact/signals-core';
import { css, html, nothing } from 'lit';
import { query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { literal, unsafeStatic } from 'lit/static-html.js';

import type { AIItemGroupConfig } from '../../components/ai-item/types.js';
import {
  AFFINE_AI_PANEL_WIDGET,
  AffineAIPanelWidget,
} from '../ai-panel/ai-panel.js';
import { EdgelessCopilotPanel } from '../edgeless-copilot-panel/index.js';

export const AFFINE_EDGELESS_COPILOT_WIDGET = 'affine-edgeless-copilot-widget';

export class EdgelessCopilotWidget extends WidgetComponent<RootBlockModel> {
  static override styles = css`
    .copilot-selection-rect {
      position: absolute;
      box-sizing: border-box;
      border-radius: 4px;
      border: 2px dashed var(--affine-brand-color, #1e96eb);
    }
  `;

  private _clickOutsideOff: (() => void) | null = null;

  private _copilotPanel!: EdgelessCopilotPanel | null;

  private _listenClickOutsideId: number | null = null;

  private _selectionModelRect!: DOMRect;

  groups: AIItemGroupConfig[] = [];

  get gfx() {
    return this.std.get(GfxControllerIdentifier);
  }

  get selectionModelRect() {
    return this._selectionModelRect;
  }

  get selectionRect() {
    return this._selectionRect;
  }

  get visible() {
    return !!(
      this._visible &&
      this._selectionRect.width &&
      this._selectionRect.height
    );
  }

  set visible(visible: boolean) {
    this._visible = visible;
  }

  private _showCopilotPanel() {
    requestConnectedFrame(() => {
      if (!this._copilotPanel) {
        const panel = new EdgelessCopilotPanel();
        panel.host = this.host;
        panel.groups = this.groups;
        this.renderRoot.append(panel);
        this._copilotPanel = panel;
      }

      const referenceElement = this.selectionElem;
      const panel = this._copilotPanel;
      // @TODO: optimize
      const viewport = this.gfx.viewport;

      if (!referenceElement || !referenceElement.isConnected) return;

      // show ai input
      const rootBlockId = this.host.doc.root?.id;
      if (rootBlockId) {
        const aiPanel = this.host.view.getWidget(
          AFFINE_AI_PANEL_WIDGET,
          rootBlockId
        );
        if (aiPanel instanceof AffineAIPanelWidget && aiPanel.config) {
          aiPanel.setState('input', referenceElement);
        }
      }

      autoUpdate(referenceElement, panel, () => {
        computePosition(referenceElement, panel, {
          placement: 'right-start',
          middleware: [
            offset({
              mainAxis: 16,
              crossAxis: 45,
            }),
            flip({
              mainAxis: true,
              crossAxis: true,
              flipAlignment: true,
            }),
            shift(() => {
              const { left, top, width, height } = viewport;
              return {
                padding: 20,
                crossAxis: true,
                rootBoundary: {
                  x: left,
                  y: top,
                  width,
                  height: height - 100,
                },
              };
            }),
            size({
              apply: ({ elements }) => {
                const { height } = viewport;
                elements.floating.style.maxHeight = `${height - 140}px`;
              },
            }),
          ],
        })
          .then(({ x, y }) => {
            panel.style.left = `${x}px`;
            panel.style.top = `${y}px`;
          })
          .catch(e => {
            console.warn("Can't compute EdgelessCopilotPanel position", e);
          });
      });
    }, this);
  }

  private _updateSelection(rect: DOMRect) {
    this._selectionModelRect = rect;

    const zoom = this.gfx.viewport.zoom;
    const [x, y] = this.gfx.viewport.toViewCoord(rect.left, rect.top);
    const [width, height] = [rect.width * zoom, rect.height * zoom];

    this._selectionRect = { x, y, width, height };
  }

  private _watchClickOutside() {
    this._clickOutsideOff?.();

    const { width, height } = this._selectionRect;

    if (width && height) {
      this._listenClickOutsideId &&
        cancelAnimationFrame(this._listenClickOutsideId);
      this._listenClickOutsideId = requestConnectedFrame(() => {
        if (!this.isConnected) {
          return;
        }

        const off = this.std.event.add('pointerDown', ctx => {
          const e = ctx.get('pointerState').raw;
          if (
            e.button === MOUSE_BUTTON.MAIN &&
            !this.contains(e.target as HTMLElement)
          ) {
            off();
            this._visible = false;
            this.hideCopilotPanel();
          }
        });
        this._listenClickOutsideId = null;
        this._clickOutsideOff = off;
      }, this);
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const CopilotSelectionTool = this.gfx.tool.get('copilot');

    this._disposables.add(
      CopilotSelectionTool.draggingAreaUpdated.on(shouldShowPanel => {
        this._visible = true;
        this._updateSelection(CopilotSelectionTool.area);
        if (shouldShowPanel) {
          this._showCopilotPanel();
          this._watchClickOutside();
        } else {
          this.hideCopilotPanel();
        }
      })
    );

    this._disposables.add(
      this.gfx.viewport.viewportUpdated.on(() => {
        if (!this._visible) return;

        this._updateSelection(CopilotSelectionTool.area);
      })
    );

    this._disposables.add(
      effect(() => {
        const currentTool = this.gfx.tool.currentToolName$.value;

        if (!this._visible || currentTool === 'copilot') return;

        this._visible = false;
        this._clickOutsideOff = null;
        this._copilotPanel?.remove();
        this._copilotPanel = null;
      })
    );
  }

  determineInsertionBounds(width = 800, height = 95) {
    const elements = this.gfx.selection.selectedElements;
    const offsetY = 20 / this.gfx.viewport.zoom;
    const bounds = new Bound(0, 0, width, height);
    if (elements.length) {
      const { x, y, h } = getCommonBoundWithRotation(elements);
      bounds.x = x;
      bounds.y = y + h + offsetY;
    } else {
      const { x, y, height: h } = this.selectionModelRect;
      bounds.x = x;
      bounds.y = y + h + offsetY;
    }
    return bounds;
  }

  hideCopilotPanel() {
    this._copilotPanel?.hide();
    this._copilotPanel = null;
    this._clickOutsideOff = null;
  }

  lockToolbar(disabled: boolean) {
    const legacySlot = this.std.get(EdgelessLegacySlotIdentifier);
    legacySlot.toolbarLocked.emit(disabled);
  }

  override render() {
    if (!this._visible) return nothing;

    const rect = this._selectionRect;

    return html`<div class="affine-edgeless-ai">
      <div
        class="copilot-selection-rect"
        style=${styleMap({
          left: `${rect.x}px`,
          top: `${rect.y}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        })}
      ></div>
    </div>`;
  }

  @state()
  private accessor _selectionRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } = { x: 0, y: 0, width: 0, height: 0 };

  @state()
  private accessor _visible = false;

  @query('.copilot-selection-rect')
  accessor selectionElem!: HTMLDivElement;
}

export const edgelessCopilotWidget = WidgetViewExtension(
  'affine:page',
  AFFINE_EDGELESS_COPILOT_WIDGET,
  literal`${unsafeStatic(AFFINE_EDGELESS_COPILOT_WIDGET)}`
);

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_EDGELESS_COPILOT_WIDGET]: EdgelessCopilotWidget;
  }
}
