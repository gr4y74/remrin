/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: false, // Don't polyfill via fallback - use ProvidePlugin instead
      };

      // Provide process globally for browser
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser.js',
        })
      );
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;