// next.config.js
module.exports = {
  experimental: {
    runtime: 'experimental-edge', // 'node.js' (default) | experimental-edge
  },
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    const path = require('path');
    const CopyWebpackPlugin = require("copy-webpack-plugin");
    // Add the new plugin to the existing webpack plugins
    config.plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'cmaps'),
            to: 'cmaps/'
          },
          {
            from: path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'build/pdf.worker.js'),
            to: 'pdf.worker.js'
          },
          {
            from: path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'build/pdf.worker.js.map'),
            to: 'pdf.worker.js.map'
          }
        ],
      }),
    );

    // Important: return the modified config
    return config
  },
}