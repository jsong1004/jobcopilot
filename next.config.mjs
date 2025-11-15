// Import build polyfills to handle browser-only APIs during build
import './lib/build-polyfills.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Removed standalone output mode as it requires complete build
  skipTrailingSlashRedirect: true,
  webpack: (config, { isServer }) => {
    // Exclude pdf-parse test files from bundle
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'canvas': 'canvas',
      });
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    return config;
  },
}

export default nextConfig