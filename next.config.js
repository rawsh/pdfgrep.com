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
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    if (!isServer) {
      const CopyPlugin = require("copy-webpack-plugin")
      const path = require('path')
      // copy file from pdfjs-dist
      config.plugins.push(
        new CopyPlugin({
          'patterns': [
            {
              'from': path.join(__dirname, './node_modules/pdfjs-dist/build/pdf.worker.js'),
              'to': path.join(__dirname, './public/dist/pdf.worker.js'),
            },
          ],
        })
      )

      // config.plugins.push(
      //   new webpack.NormalModuleReplacementPlugin(
      //     /^pdfjs-dist$/,
      //     resource => {
      //       resource.request = path.join(__dirname, './node_modules/pdfjs-dist/webpack')
      //     }
      //   )
      // )
        
      // config.entry['pdf.worker'] = path.join(__dirname, './node_modules/pdfjs-dist/build/pdf.worker.js')
    }
    return config
  },
  experimental: {
    appDir: true,
    runtime: 'experimental-edge', // 'node.js' (default) | experimental-edge
  },
  reactStrictMode: true,
  swcMinify: true,
}
module.exports = nextConfig