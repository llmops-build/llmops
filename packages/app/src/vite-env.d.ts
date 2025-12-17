/// <reference types="vite/client" />

export interface BootstrapData {
  basePath?: string;
  llmProviders?: {
    key: string;
    name: string;
    imageURI: string;
  }[];
}

declare global {
  interface Window {
    bootstrapData?: BootstrapData;
  }
}
