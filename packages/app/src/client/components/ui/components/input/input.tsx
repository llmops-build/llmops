import { forwardRef, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';
import { inputRecipe, type InputVariants } from './input.css';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, InputVariants {
  size?: InputVariants['size'];
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant, size, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx(inputRecipe({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
