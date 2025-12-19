import type { ComponentPropsWithoutRef, HTMLAttributes } from 'react';
import clsx from 'clsx';
import { ArrowUp, ArrowDown } from 'lucide-react';
import * as styles from './table.css';

export interface TableProps extends ComponentPropsWithoutRef<'div'> {
  className?: string;
}

export const Table = ({ className, children, ...props }: TableProps) => {
  return (
    <div {...props} className={clsx(styles.tableContainer, className)}>
      <table className={styles.table}>{children}</table>
    </div>
  );
};

export interface TableHeaderProps extends ComponentPropsWithoutRef<'thead'> {
  className?: string;
}

export const TableHeader = ({
  className,
  children,
  ...props
}: TableHeaderProps) => {
  return (
    <thead {...props} className={clsx(styles.tableHeader, className)}>
      {children}
    </thead>
  );
};

export interface TableBodyProps extends ComponentPropsWithoutRef<'tbody'> {
  className?: string;
}

export const TableBody = ({
  className,
  children,
  ...props
}: TableBodyProps) => {
  return (
    <tbody {...props} className={clsx(styles.tableBody, className)}>
      {children}
    </tbody>
  );
};

export interface TableRowProps extends ComponentPropsWithoutRef<'tr'> {
  className?: string;
  interactive?: boolean;
  selected?: boolean;
}

export const TableRow = ({
  className,
  interactive,
  selected,
  children,
  ...props
}: TableRowProps) => {
  return (
    <tr
      {...props}
      className={clsx(styles.tableRow({ interactive, selected }), className)}
    >
      {children}
    </tr>
  );
};

export interface TableHeaderCellProps extends ComponentPropsWithoutRef<'th'> {
  className?: string;
  sortable?: boolean;
  onSort?: () => void;
  sortDirection?: 'asc' | 'desc' | null;
}

export const TableHeaderCell = ({
  className,
  sortable,
  sortDirection,
  children,
  ...props
}: TableHeaderCellProps & {
  onClick?: HTMLAttributes<HTMLButtonElement>['onClick'];
}) => {
  const content = sortable ? (
    <button type="button" className={styles.sortButton} onClick={props.onClick}>
      {children}
      {sortDirection === 'asc' && <ArrowUp size={12} />}
      {sortDirection === 'desc' && <ArrowDown size={12} />}
    </button>
  ) : (
    children
  );

  return (
    <th {...props} className={clsx(styles.tableHeaderCell, className)}>
      {content}
    </th>
  );
};

export interface TableCellProps extends ComponentPropsWithoutRef<'td'> {
  className?: string;
}

export const TableCell = ({
  className,
  children,
  ...props
}: TableCellProps) => {
  return (
    <td {...props} className={clsx(styles.tableCell, className)}>
      {children}
    </td>
  );
};
