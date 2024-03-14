import { Fragment, type PropsWithChildren, useState } from 'react';

import { type LitPortal, LitPortalContext } from './context';

export const LitPortalProvider = ({ children }: PropsWithChildren) => {
  const [portals, updatePortals] = useState<LitPortal[]>([]);
  return (
    <LitPortalContext.Provider
      value={{
        portals,
        updatePortals,
      }}
    >
      {children}
      {portals.map(p => (
        <Fragment key={p.id}>{p.portal}</Fragment>
      ))}
    </LitPortalContext.Provider>
  );
};
