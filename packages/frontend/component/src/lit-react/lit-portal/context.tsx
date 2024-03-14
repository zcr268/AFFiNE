import type { ReactPortal } from 'react';
import { createContext } from 'react';

export type LitPortal = { id: string; portal: ReactPortal };

export const LitPortalContext = createContext<{
  portals: LitPortal[];
  updatePortals: React.Dispatch<React.SetStateAction<LitPortal[]>>;
}>({
  portals: [],
  updatePortals: () => {},
});
