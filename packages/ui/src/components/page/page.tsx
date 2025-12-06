import clsx from 'clsx';
import type { HTMLAttributes } from 'react';
import { outer, inner } from './page.css';

const Page = (pageProps: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={outer}>
      <div {...pageProps} className={clsx(inner, pageProps.className)} />
    </div>
  );
};

export { Page };
