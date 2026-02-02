import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Treat workspace packages and their dependencies as external server packages
  serverExternalPackages: [
    'pg',
    '@llmops/sdk',
    '@llmops/app',
    '@llmops/core',
    'react-dom',
  ],
  // Suppress output file tracing warning for monorepo
  outputFileTracingRoot: process.cwd(),
  // Disable ESLint during builds (project uses root eslint config)
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark these packages as external to avoid bundling issues
      config.externals = config.externals || [];
      config.externals.push({
        '@llmops/app': 'commonjs @llmops/app',
      });
    }
    return config;
  },
};

export default nextConfig;
