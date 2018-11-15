
const fs = require('fs'),
  parseArgs = require('minimist'),
  chalk = require('chalk'),
  os = require('os'),
  spawn = require('cross-spawn').sync,
  appPaths = require('../app-paths'),
  dotenv = require('dotenv'),
  getExternalIPs = require('./net').getExternalNetworkInterface

const isWin = process.platform === 'win32';
const home = isWin ? process.env.USERPROFILE : process.env.HOME;
/**
 *
 * Core Variables
 *
 * Q_APP
 *  - NAME=
 *  - PROTOCOL=
 *  - HOST=
 *  - PORT=
 * Q_NETWORK
 *  - INTERFACE_X=
 * Q_OS
 *  - TYPE=
 *  - RELEASE=
 *  - PLATFORM=
 *  - ARCH=
 * Q_NODE
 *   - ENV=
 *   - VERSION=
 *   -
 *
 * @todo
 * It may be possible to add flags for Quasar at a very high level. Similar to grunt-source but with added ENV VARS
 * https://stackoverflow.com/questions/42519452/is-it-possible-to-permanently-set-environment-variables
 * https://www.npmjs.com/package/grunt-source
 * @example
 * Q_HOME=~/.quasar
 *
 * Info grab from printenv on local machine. Looking for useful variables we can leverage:
 *
 * *NIX
 *  - HOME='~/'
 * WINDOWS
 *  - USERPROFILE='~/'
 * Docker:
 *  - DOCKER_HOST='tcp://127.0.0.1:2376'
 *  - DOCKER_CERT_PATH='/some/local/path'
 *  - DOCKER_MACHINE_NAME='default'
 *  - DOCKER_TLS_VERIFY='1'
 * JAVA:
 *  - JAVA_HOME
 * ANDROID:
 *  - ANDROID_HOME
 * NODE:
 *  - NODE
 *  - NODE_ENV
 * NVM:
 *  - NVM_HOME='/some/local/path'
 *  - NVM_SYMLINK='/some/path/to/node'
 * NPM:
 *  - npm_package_version='0.0.0'
 *  - npm_execpath='path/to/yarn/or/npm'
 * YARN:
 *  - CHILD_CONCURRENCY=1
 *  - YARN_WRAP_OUTPUT
 *  - npm_config
 */
class Environment {
  constructor() {
    console.log(process.env)
    if (fs.existsSync(`${process.cwd()}/.env`)) {
      const result = dotenv.config()

      if (result.error) {
        throw result.error
      }
    }

    this.app = {
      srcPath: this.get('Q_APP_SRC_PATH') || 'src',
      name: this.get('Q_APP_NAME')

    }

    this.node = {
      env: this._getENV(),
      version: process.version.slice(1),
      globals: {
        npm: this._getSpawnOutput('npm'), // TODO get from ENV vars if available
        yarn: this._getSpawnOutput('yarn'), // TODO get from ENV vars if available
        quasar: this._getSpawnOutput('quasar'), // TODO add to ENV vars during global install
        vue: this._getSpawnOutput('vue'),
        cordova: this._getSpawnOutput('cordova')
      },
      locals: this._getLocals()
    }
    this.os = {
      type: os.type(),
      release: os.release(),
      platform: os.platform(),
      arch: os.arch()
    }
    // this.network = getExternalIPs().map(intf => {
    //
    //   return {
    //     key: `  ${ intf.deviceName }`,
    //     value: chalk.green(intf.address)
    //   })
    // })
  }
  // TODO: Handle keys with multiple capital characters like keyENV
  _mapCamelCaseToENV (name) {
    return `Q_${name.replace(/([A-Z])/g, ' $1')
      .toUpperCase()
      .split(' ')
      .join('_')}`
  }
  // TODO
  _getLocals() {
    // let locals = {}
    // [
    //   'quasar-cli',
    //   'quasar-framework',
    //   'quasar-extras',
    //   'vue',
    //   'vue-router',
    //   'vuex',
    //   'electron',
    //   'electron-packager',
    //   'electron-builder',
    //   '@babel/core',
    //   'webpack',
    //   'webpack-dev-server',
    //   'workbox-webpack-plugin',
    //   'register-service-worker'
    // ].forEach(pkg => locals[pkg] = this._safePkgInfo(pkg))
    // return locals
  }

  // TODO: Strip chalk for printing ENV files/printenv style output
  _getSpawnOutput(command) {
    try {
      const child = spawn(command, ['--version'])
      return child.status === 0
        ? chalk.green(String(child.output[1]).trim())
        : chalk.red('Not installed')
    }
    catch (err) {
      return chalk.red('Not installed')
    }
  }

  // TODO: Strip chalk for printing ENV files/printenv style output
  // RESEARCH: Possibly safely pull from NPM_ ENV variables?
  _safePkgInfo(pkg) {
    try {
      const content = require(appPaths.resolve.app(`node_modules/${pkg}/package.json`))
      return {
        key: `  ${String(content.name).trim()}`,
        value: `${chalk.green(String(content.version).trim())}${content.description ? `\t(${content.description})` : ''}`
      }
    }
    catch (err) {
      return {
        key: `  ${pkg}`,
        value: chalk.red('Not installed')
      }
    }
  }

  isSet(key) {
    return (typeof this.get(key) !== 'undefined')
  }

  _getENV() {
    if (this.isSet('Q_ENV')) {
      return this.get('Q_ENV')
    } else if (this.isSet('NODE_ENV')) {
      return this.get('NODE_ENV')
    } else {
      return 'develop'
    }
  }

  isDevelop() {
    return (this._getENV() === 'develop')
  }

  isProduction() {
    return (this._getENV() === 'production')
  }

  save() {

  }

  batchUpdate(batch) {
    batch.forEach((envVariable) => {
      let sSplit = envVariable.split('=').map(splitItems => splitItems.trim())
      this.set(sSplit[0], sSplit[1])
    })
  }

  set(key, value) {
    process.env[key] = value
  }

  get(key) {
    return process.env[key]
  }

  getAll() {
    return Object.keys(process.env).filter((envKey) => {
      return (envKey.match(/^Q_.*/g) && typeof envKey.match(/^Q_.*/g).length !== 'undefined')
    }).map((envKey) => {
      return `${envKey}=${this.get(envKey)}`
    })
  }
}

// Singleton export
let env
module.exports = () => {
  if (typeof env === 'undefined') {
    env = new Environment()
  }
  return env
}
