import clsx from 'clsx';
import type { HTMLAttributes } from 'react';
import { create, props } from '@stylexjs/stylex';

import { spacing } from '../../tokens/spacing.stylex';
import { colors } from '../../tokens/colors.stylex';

const outerStyles = create({
  base: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'stretch',
    alignItems: 'stretch',
    padding: spacing.sm,
    backgroundColor: colors.gray2,
  },
});

const innerStyles = create({
  base: {
    flexGrow: 1,
    borderRadius: spacing.xs,
    display: 'grid',
    gridTemplateColumns: 'var(--sidebar-width) repeat(8, 1fr)',
    gridTemplateRows: `${spacing['2xl']} auto`,
  },
});

const Page = (pageProps: HTMLAttributes<HTMLDivElement>) => {
  const outerStylexProps = props(outerStyles.base);
  const innerStylexProps = props(innerStyles.base);

  const allProps = {
    ...pageProps,
    ...innerStylexProps,
    className: clsx(innerStylexProps.className, pageProps.className),
  };
  return (
    <div {...outerStylexProps}>
      <div {...allProps} />
    </div>
  );
};

export { Page };
