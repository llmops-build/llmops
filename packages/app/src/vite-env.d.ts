/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

export interface BootstrapData {
  basePath?: string;
  authType?: 'basic' | 'clerk' | string;
  setupComplete?: boolean;
}

declare global {
  interface Window {
    bootstrapData?: BootstrapData;
  }
}
