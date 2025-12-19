const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true"
})

// Only load next-pwa in development to avoid Edge Runtime __dirname issues
const withPWA =
  process.env.NODE_ENV === "production"
    ? (config) => config  // No-op wrapper in production
    : require("next-pwa")({
      dest: "public"
    })

module.exports = withBundleAnalyzer(
  withPWA({
    reactStrictMode: true,
    images: {
      remotePatterns: [
        {
          protocol: "http",
          hostname: "localhost"
        },
        {
          protocol: "http",
          hostname: "127.0.0.1"
        },
        {
          protocol: "https",
          hostname: "**"
        }
      ]
    },
    experimental: {
      serverComponentsExternalPackages: ["sharp", "onnxruntime-node", "@xenova/transformers", "next-pwa"]
    }
  })
)
