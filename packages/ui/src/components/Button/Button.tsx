import { Button as RAButton, type ButtonProps } from 'react-aria-components';
import clsx from 'clsx';
import { base } from './button.css';

export const Button = (props: ButtonProps) => {
  return (
    <RAButton
      {...props}
      className={clsx(base, props.className)}
    />
  );
};

export type { ButtonProps };
