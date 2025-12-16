import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@client/lib/queryClient';

const Providers = ({ children }: PropsWithChildren): React.ReactElement => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export { Providers };
