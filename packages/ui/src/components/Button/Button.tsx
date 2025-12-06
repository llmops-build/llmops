import { Button as RAButton, type ButtonProps as RAButtonProps } from 'react-aria-components';
import clsx from 'clsx';
import { buttonRecipe, type ButtonVariants } from './button.css';

export interface ButtonProps extends RAButtonProps {
  variant?: ButtonVariants['variant'];
  size?: ButtonVariants['size'];
  fullWidth?: ButtonVariants['fullWidth'];
}

export const Button = ({ variant, size, fullWidth, className, ...props }: ButtonProps) => {
  return (
    <RAButton
      {...props}
      className={clsx(buttonRecipe({ variant, size, fullWidth }), className)}
    />
  );
};
