/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POSTHOG_KEY: string;
  readonly VITE_POSTHOG_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Virtual module for raw MDX content
declare module 'virtual:raw-mdx-content' {
  export const mdxContent: Record<string, string>;
}
