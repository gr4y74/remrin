/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Only apply polyfills on the client (browser) side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // If a library explicitly asks for 'process', give it this file:
        process: require.resolve('process/browser'),
      };
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