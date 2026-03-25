import {
  useMemo,
  type ReactElement,
  type ComponentPropsWithoutRef,
} from 'react';
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

// Normalize key by removing double slashes and trailing slashes
const normalizeKey = (key: string): string => {
  return key
    .replace(/\/+/g, '/') // Replace multiple slashes with single slash
    .replace(/\/$/, ''); // Remove trailing slash
};

export const Breadcrumbs = ({
  items,
  separator = '/',
  className,
  ...props
}: BreadcrumbsProps) => {
  // Filter out duplicates based on normalized keys
  const uniqueItems = useMemo(() => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const normalized = normalizeKey(item.key);
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }, [items]);

  return (
    <nav
      {...props}
      className={clsx(breadcrumbsContainer, className)}
      aria-label="Breadcrumb"
    >
      {uniqueItems.map((item, index) => (
        <div key={item.key} className={breadcrumbItem}>
          {item.prefix}
          <div className={breadcrumbLink}>{item.label}</div>
          {index < uniqueItems.length - 1 && (
            <span className={breadcrumbSeparator} aria-hidden="true">
              {separator}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};
