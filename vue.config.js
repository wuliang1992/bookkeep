const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath: process.env.NODE_ENV === 'production' ? '/' : './',
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    port: 8086,
    open: true,
    host: 'localhost',
    proxy: {
      '/bookkeep': {
        target: 'http://localhost:8066',
        changeOrigin: true,
        pathRewrite: { '^/bookkeep': '' }
      }
    }
  }
})

