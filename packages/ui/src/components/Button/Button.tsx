import {
  Button as BaseButton,
  type ButtonProps as BaseButtonProps,
} from '@base-ui/react';
import clsx from 'clsx';
import { buttonRecipe, type ButtonVariants } from './button.css';

export interface TButtonProps {
  variant?: ButtonVariants['variant'];
  scheme?: ButtonVariants['scheme'];
  size?: ButtonVariants['size'];
}

export type ButtonProps = TButtonProps & BaseButtonProps;

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
