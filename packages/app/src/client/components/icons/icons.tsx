import type { ComponentPropsWithoutRef } from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { iconRecipe, type IconVariants } from '../icon/icon.css';

export interface IconProps extends Omit<
  ComponentPropsWithoutRef<'span'>,
  'children'
> {
  icon: LucideIcon;
  size?: IconVariants['size'];
}

export const Icon = ({
  icon: IconComponent,
  size = 'sm',
  className,
  ...props
}: IconProps) => {
  return (
    <span className={clsx(iconRecipe({ size }), className)} {...props}>
      <IconComponent />
    </span>
  );
};
