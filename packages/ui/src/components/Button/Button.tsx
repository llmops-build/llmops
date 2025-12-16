import type { ComponentPropsWithoutRef } from 'react';
import { Button as BaseButton } from '@base-ui/react';
import clsx from 'clsx';
import { buttonRecipe, type ButtonVariants } from './button.css';

export interface ButtonProps extends Omit<
  ComponentPropsWithoutRef<typeof BaseButton>,
  'className'
> {
  variant?: ButtonVariants['variant'];
  scheme?: ButtonVariants['scheme'];
  size?: ButtonVariants['size'];
  className?: string;
}

export const Button = ({
  variant,
  scheme,
  size,
  className,
  children,
  ...props
}: ButtonProps) => {
  return (
    <BaseButton
      {...props}
      className={clsx(buttonRecipe({ variant, size, scheme }), className)}
    >
      {children}
    </BaseButton>
  );
};
