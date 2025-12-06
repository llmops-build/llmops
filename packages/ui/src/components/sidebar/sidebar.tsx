import type { HTMLAttributes } from 'react';
import clsx from 'clsx';
import { base } from './sidebar.css';

const Sidebar = (sidebarProps: HTMLAttributes<HTMLElement>) => {
  return (
    <aside
      {...sidebarProps}
      className={clsx(base, sidebarProps.className)}
    />
  );
};

export { Sidebar };
