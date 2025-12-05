import type { HTMLAttributes } from 'react';
import { create, props } from '@stylexjs/stylex';
import clsx from 'clsx';
import { spacing } from '../../tokens/spacing.stylex';

const headerStyles = create({
  base: {
    height: spacing['2xl'],
    gridColumn: '2 / -1',
  },
});

export const Header = (headerProps: HTMLAttributes<HTMLElement>) => {
  const stylexProps = props(headerStyles.base);
  return (
    <header
      {...headerProps}
      {...stylexProps}
      className={clsx(headerProps.className, stylexProps.className)}
    />
  );
};
