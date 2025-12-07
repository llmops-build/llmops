/// <reference types="vite/client" />

export interface BootstrapData {
  basePath?: string;
}

declare global {
  interface Window {
    bootstrapData?: BootstrapData;
  }
}
