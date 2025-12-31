/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

export interface BootstrapData {
  basePath?: string;
  llmProviders?: {
    key: string;
    name: string;
    imageURI: string;
  }[];
  authType?: 'basic' | 'clerk' | string;
}

declare global {
  interface Window {
    bootstrapData?: BootstrapData;
  }
}
