import type { PropsWithChildren, ReactElement } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@client/lib/queryClient';
import { ToastProvider } from '@client/components/toast';

const Providers = ({ children }: PropsWithChildren): ReactElement => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
};

export { Providers };
