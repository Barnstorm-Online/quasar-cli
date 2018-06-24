const
  appPaths = require('../../app-paths'),
  PwaManifestPlugin = require('./plugin.pwa-manifest')

module.exports = function (chain, cfg) {
  // write manifest.json file
  chain.plugin('pwa-manifest')
    .use(PwaManifestPlugin, [{ manifest: cfg.pwa.manifest }])

  if (cfg.ctx.dev) {
    const DevServiceWorker = require('./plugin.dev-service-worker')
    chain.plugin('service-worker')
      .use(DevServiceWorker)
  }
  else {
    let defaultOptions
      const
        WorkboxPlugin = require('workbox-webpack-plugin'),
        HtmlPwaPlugin = require('./plugin.html-pwa'),
        pluginMode = cfg.pwa.workboxPluginMode,
        log = require('../helpers/logger')('app:workbox')

      if (pluginMode === 'GenerateSW') {
        const pkg = require(appPaths.resolve.app('package.json'))

        defaultOptions = {
          cacheId: pkg.name || 'quasar-pwa-app'
        }

        log('[GenerateSW] Will generate a service-worker file. Ignoring your custom written one.')
      }
      else {
        defaultOptions = {
          swSrc: appPaths.resolve.app(cfg.sourceFiles.serviceWorker)
        }

        log('[InjectManifest] Using your custom service-worker written file')
      }

      chain.plugin('workbox')
        .use(WorkboxPlugin[pluginMode], [
          Object.assign(
            defaultOptions,
            cfg.pwa.workboxOptions,
            { swDest: 'service-worker.js' }
          )
        ])

      chain.plugin('html-pwa')
        .use(HtmlPwaPlugin, [{ manifest: cfg.pwa.manifest }])
  }
}