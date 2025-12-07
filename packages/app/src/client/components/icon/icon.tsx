import type { ComponentPropsWithoutRef } from 'react';
import { clsx } from 'clsx';
import { iconRecipe, type IconVariants } from './icon.css';

export interface IconProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  children: React.ReactElement; // Lucide icon component
  size?: IconVariants['size'];
}

export const Icon = ({ children, size, className, ...props }: IconProps) => {
  return (
    <span className={clsx(iconRecipe({ size }), className)} {...props}>
      {children}
    </span>
  );
};