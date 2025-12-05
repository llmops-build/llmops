import { create, props } from '@stylexjs/stylex';
import type { HTMLAttributes } from 'react';
import { colors } from '../../tokens/colors.stylex';
import clsx from 'clsx';

const sidebarBarStyles = create({
  base: {
    width: 'var(--sidebar-width)',
    gridRow: '1 / 3',
    height: '100%',
    backgroundColor: colors.gray2,
  },
});

const Sidebar = (sidebarProps: HTMLAttributes<HTMLElement>) => {
  const stylexProps = props(sidebarBarStyles.base);
  return (
    <aside
      {...sidebarProps}
      {...stylexProps}
      className={clsx(stylexProps.className, sidebarProps.className)}
    />
  );
};

export { Sidebar };
