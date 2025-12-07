import type { ComponentPropsWithoutRef } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import clsx from 'clsx';
import { buttonRecipe, type ButtonVariants } from './button.css';

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<typeof AriaButton>, 'className'> {
  variant?: ButtonVariants['variant'];
  size?: ButtonVariants['size'];
  fullWidth?: ButtonVariants['fullWidth'];
  className?: string;
}

export const Button = ({
  variant,
  size,
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) => {
  return (
    <AriaButton
      {...props}
      className={clsx(buttonRecipe({ variant, size, fullWidth }), className)}
    >
      {children}
    </AriaButton>
  );
};