import { Button as RAButton, type ButtonProps } from 'react-aria-components';
import * as stylex from '@stylexjs/stylex';
import { spacing } from '../../tokens/spacing.stylex';

const styles = stylex.create({
  base: {
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
});

export const Button = (props: ButtonProps) => {
  const styleProps = stylex.props(styles.base);
  return (
    <RAButton
      {...styleProps}
      {...props}
      className={`${styleProps.className || ''} ${props.className || ''}`.trim()}
    />
  );
};

export type { ButtonProps };
