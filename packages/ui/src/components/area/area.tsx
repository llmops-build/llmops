import { create, props } from '@stylexjs/stylex';
import clsx from 'clsx';
import type { HTMLAttributes } from 'react';
import { colors } from '../../tokens/colors.stylex';
import { spacing } from '../../tokens/spacing.stylex';

const areaStyles = create({
  base: {
    gridColumn: '2 / -1',
    gridRow: '2 / 3',
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colors.gray4,
    overflow: 'hidden',
  },
});

const Area = (areaProps: HTMLAttributes<HTMLElement>) => {
  const areaStylexProps = props(areaStyles.base);
  return (
    <main
      {...areaProps}
      {...areaStylexProps}
      className={clsx(areaStylexProps.className, areaProps.className)}
    />
  );
};

export { Area };
