import { Logo1Icon } from '@blocksuite/icons/rc';
import type { FC } from 'react';

import { authHeaderWrapper } from './share.css';
export const AuthHeader: FC<{
  title: string;
  subTitle?: string;
}> = ({ title, subTitle }) => {
  return (
    <div className={authHeaderWrapper}>
      <p>
        <Logo1Icon className="logo" />
        {title}
      </p>
      <p>{subTitle}</p>
    </div>
  );
};
