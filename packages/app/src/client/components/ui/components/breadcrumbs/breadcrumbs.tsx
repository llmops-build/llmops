import type { ReactElement, ComponentPropsWithoutRef } from 'react';
import clsx from 'clsx';
import {
  breadcrumbsContainer,
  breadcrumbItem,
  breadcrumbLink,
  breadcrumbSeparator,
} from './breadcrumbs.css';

export interface BreadcrumbItem {
  key: string;
  prefix?: ReactElement;
  label: ReactElement;
}

export interface BreadcrumbsProps extends ComponentPropsWithoutRef<'nav'> {
  items: BreadcrumbItem[];
  separator?: ReactElement | string;
  className?: string;
}

export const Breadcrumbs = ({
  items,
  separator = '/',
  className,
  ...props
}: BreadcrumbsProps) => {
  return (
    <nav
      {...props}
      className={clsx(breadcrumbsContainer, className)}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <div key={item.key} className={breadcrumbItem}>
          {item.prefix}
          <div className={breadcrumbLink}>{item.label}</div>
          {index < items.length - 1 && (
            <span className={breadcrumbSeparator} aria-hidden="true">
              {separator}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};
