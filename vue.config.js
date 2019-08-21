module.exports = {
    publicPath: process.env.NODE_ENV === 'production'
      ? '/battleslides-image/'
      : '/',
      devServer: {
        open: process.platform === 'darwin',
        host: '0.0.0.0',
        port: 8081, // CHANGE YOUR PORT HERE!
        https: true,
        hotOnly: false,
      },
  }