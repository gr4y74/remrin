/** @type {import('next').NextConfig} */
const webpack = require('webpack'); // <--- access the internal tools

const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 1. Tell Webpack: "If anyone asks for 'process', give them this file."
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve('process/browser'),
      };

      // 2. The "God Mode" Plugin: Auto-inject 'process' everywhere
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
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