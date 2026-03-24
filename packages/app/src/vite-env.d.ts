/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

export interface BootstrapData {
  basePath?: string;
}

declare global {
  interface Window {
    bootstrapData?: BootstrapData;
  }
}
