import type { HTMLAttributes } from 'react';
import clsx from 'clsx';
import {
  sidebarRecipe,
  headerRecipe,
  footerRecipe,
  contentRecipe,
  type SidebarVariants,
  type SidebarHeaderVariants,
  type SidebarFooterVariants,
} from './sidebar.css';

export interface SidebarHeaderProps extends HTMLAttributes<HTMLDivElement> {
  centered?: SidebarHeaderVariants['centered'];
}
export interface SidebarFooterProps extends HTMLAttributes<HTMLDivElement> {
  centered?: SidebarFooterVariants['centered'];
}
export interface SidebarContentProps extends HTMLAttributes<HTMLElement> {}
export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  collapsed?: SidebarVariants['collapsed'];
  position?: SidebarVariants['position'];
  theme?: SidebarVariants['theme'];
}

const SidebarHeader = ({
  centered,
  className,
  ...props
}: SidebarHeaderProps) => {
  return (
    <div
      slot="sidebar-header"
      {...props}
      className={clsx(headerRecipe({ centered }), className)}
    />
  );
};

const SidebarFooter = ({
  centered,
  className,
  ...props
}: SidebarFooterProps) => {
  return (
    <div
      slot="sidebar-footer"
      {...props}
      className={clsx(footerRecipe({ centered }), className)}
    />
  );
};

const SidebarContent = ({ className, ...props }: SidebarContentProps) => {
  return <aside {...props} className={clsx(contentRecipe(), className)} />;
};

const Sidebar = ({
  collapsed,
  position,
  theme,
  className,
  ...props
}: SidebarProps) => {
  return (
    <aside
      {...props}
      className={clsx(sidebarRecipe({ collapsed, position, theme }), className)}
    />
  );
};

export { Sidebar, SidebarHeader, SidebarFooter, SidebarContent };
