import { html, LitElement } from 'lit';
import { nanoid } from 'nanoid';
import {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import ReactDOM from 'react-dom';

import { LitPortalContext } from './context';

const TrackedLifecycles = [
  'connectedCallback',
  'disconnectedCallback',
] as const;

type TrackedLifecycle = (typeof TrackedLifecycles)[number];

type PortalListener = (
  portalId: string,
  lifecycle: TrackedLifecycle,
  portal: LitReactPortal
) => void;
const listeners: Set<PortalListener> = new Set();

export function createLitPortalAnchor(
  callback: (lifecycle: TrackedLifecycle, anchor: LitReactPortal) => void
) {
  const id = nanoid();
  listeners.add((portalId, lifecycle, portalAnchor) => {
    if (portalId !== id) {
      return;
    }
    callback(lifecycle, portalAnchor);
  });
  return [
    html`<lit-react-portal portalId=${id}></lit-react-portal>`,
    id,
  ] as const;
}

class LitReactPortal extends LitElement {
  portalId: string = '';

  static override get properties() {
    return {
      portalId: { type: String },
    };
  }

  // do not enable shadow root
  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    listeners.forEach(l => l(this.portalId, 'connectedCallback', this));
  }

  override disconnectedCallback() {
    listeners.forEach(l => l(this.portalId, 'disconnectedCallback', this));
  }
}

window.customElements.define('lit-react-portal', LitReactPortal);

declare global {
  interface HTMLElementTagNameMap {
    'lit-react-portal': LitReactPortal;
  }
}

export type ElementOrFactory = React.ReactElement | (() => React.ReactElement);

// returns a factory function that renders a given element to a lit template
export const useLitPortalFactory = () => {
  const { updatePortals } = useContext(LitPortalContext);

  return useCallback(
    (elementOrFactory: ElementOrFactory) => {
      const element =
        typeof elementOrFactory === 'function'
          ? elementOrFactory()
          : elementOrFactory;

      return createLitPortalAnchor((lifecycle, anchor) => {
        const portalId = anchor.portalId;
        updatePortals(portals => {
          if (lifecycle === 'connectedCallback') {
            return [
              ...portals.filter(p => p.id !== portalId),
              {
                id: portalId,
                portal: ReactDOM.createPortal(element, anchor),
              },
            ];
          } else {
            return portals.filter(p => p.id !== portalId);
          }
        });
      })[0];
    },
    [updatePortals]
  );
};

// render a react element to a lit template
export const useLitPortal = (elementOrFactory: ElementOrFactory) => {
  const { updatePortals: updatePortals } = useContext(LitPortalContext);
  const [anchor, setAnchor] = useState<HTMLElement>();
  const [template, portalId] = useMemo(
    () =>
      createLitPortalAnchor((lifecycle, anchor) => {
        if (lifecycle === 'connectedCallback') {
          setAnchor(anchor.renderRoot as HTMLElement);
        } else {
          setAnchor(undefined);
        }
      }),
    []
  );

  const element = useMemo(
    () =>
      typeof elementOrFactory === 'function'
        ? elementOrFactory()
        : elementOrFactory,
    [elementOrFactory]
  );

  useLayoutEffect(() => {
    updatePortals(portals => {
      if (anchor) {
        return [
          ...portals.filter(p => p.id !== portalId),
          { id: portalId, portal: ReactDOM.createPortal(element, anchor) },
        ];
      } else {
        return portals.filter(p => p.id !== portalId);
      }
    });
  }, [anchor, portalId, element, updatePortals]);

  return template;
};
