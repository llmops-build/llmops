'use client';
import type { ReactNode } from 'react';
import { Toast } from '@base-ui/react/toast';
import { X } from 'lucide-react';
import {
  toastViewport,
  toastRoot,
  toastContent,
  toastTitle,
  toastDescription,
  toastClose,
  toastIcon,
} from './toast.css';

export const toastManager = Toast.createToastManager();

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider toastManager={toastManager}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className={toastViewport}>
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className={toastRoot}>
      <Toast.Content className={toastContent}>
        <Toast.Title className={toastTitle} />
        <Toast.Description className={toastDescription} />
        <Toast.Close className={toastClose} aria-label="Close">
          <X className={toastIcon} />
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

// Convenience functions for showing toasts
export const showToast = {
  info: (title: string, description?: string) => {
    toastManager.add({ title, description });
  },
  success: (title: string, description?: string) => {
    toastManager.add({ title, description });
  },
  error: (title: string, description?: string) => {
    toastManager.add({ title, description });
  },
};

export { Toast };
