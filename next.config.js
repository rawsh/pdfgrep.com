/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/dist/pdfgrep.wasm',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/wasm',
          },
        ],
      },
    ]
  },
  experimental: {
    appDir: true,
    runtime: 'experimental-edge', // 'node.js' (default) | experimental-edge
  },
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { dev, isServer }) => {

    // Note, preact is only enabled for production builds (`next build`)
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "react/jsx-runtime.js": "preact/compat/jsx-runtime",
        react: "preact/compat",
        "react-dom/test-utils": "preact/test-utils",
        "react-dom": "preact/compat",
      };
    }

    return config;
  },
}
module.exports = nextConfig