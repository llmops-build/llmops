import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Mark server-side packages as external to avoid webpack bundling issues
  // with native modules (fsevents, pg) and server-only code
  serverExternalPackages: [
    '@llmops/app',
    '@llmops/core',
    '@llmops/sdk',
    'pg',
    'nunjucks',
    'chokidar',
    'fsevents',
  ],
  // Suppress output file tracing warning for monorepo
  outputFileTracingRoot: process.cwd(),
  // Disable ESLint during builds (project uses root eslint config)
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark native/problematic modules as externals
      // This prevents webpack from trying to bundle them
      config.externals = config.externals || [];
      config.externals.push({
        fsevents: 'commonjs fsevents',
        chokidar: 'commonjs chokidar',
        nunjucks: 'commonjs nunjucks',
      });
    }
    return config;
  },
};

export default nextConfig;
