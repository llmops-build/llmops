import clsx from 'clsx';
import type { HTMLAttributes } from 'react';
import { base } from './area.css';

const Area = (areaProps: HTMLAttributes<HTMLElement>) => {
  return (
    <main
      {...areaProps}
      className={clsx(base, areaProps.className)}
    />
  );
};

export { Area };
