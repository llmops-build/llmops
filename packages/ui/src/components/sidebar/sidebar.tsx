import type { HTMLAttributes } from 'react';
import * as React from 'react';
import clsx from 'clsx';
import { Button } from 'react-aria-components';
import { Slot } from '@radix-ui/react-slot';
import {
  sidebarRecipe,
  headerRecipe,
  footerRecipe,
  contentRecipe,
  sidebarItem,
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
export interface SidebarContentProps extends HTMLAttributes<HTMLDivElement> {}
export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  collapsed?: SidebarVariants['collapsed'];
  position?: SidebarVariants['position'];
  theme?: SidebarVariants['theme'];
}

export interface SidebarItemButtonProps {}

export type SidebarItemProps = {
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any; // Allow all other props to pass through
};

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
  return <div {...props} className={clsx(contentRecipe(), className)} />;
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

const SidebarItem = ({
  className,
  asChild = false,
  children,
  ...props
}: SidebarItemProps) => {
  const itemClassName = clsx(sidebarItem(), className);

  const Comp = asChild ? Slot : Button;

  return (
    <Comp className={itemClassName} {...props}>
      {children}
    </Comp>
  );
};

export { Sidebar, SidebarHeader, SidebarFooter, SidebarContent, SidebarItem };
