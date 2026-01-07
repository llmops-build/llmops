import type { HTMLAttributes } from 'react';
import clsx from 'clsx';
import { base } from './header.css';

export const Header = (headerProps: HTMLAttributes<HTMLElement>) => {
  return (
    <header {...headerProps} className={clsx(base, headerProps.className)} />
  );
};
