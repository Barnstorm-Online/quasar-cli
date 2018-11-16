const fs = require('fs'),
  os = require('os'),
  spawn = require('cross-spawn').sync,
  appPaths = require('../app-paths'),
  dotenv = require('dotenv'),
  getExternalIPs = require('../helpers/net').getExternalNetworkInterface

/**
 * Environment
 *
 *  Helper for "Environment State". Primarily serves as an
 *  abstraction for ./lib/quasar-config.js && quasar.config.js
 *  for interoperability to other systems/downstream users.
 *
 *  The variables must be loaded as early as possible, before
 *  any other configurations and should be considered the source
 *  of truth. Only ( save || log ) keys that pertain to
 *  quasar.config.js when it's absolutely necessary.
 *
 *  @example
 *    process.env.Q_APP_NAME="Quasar App"
 *
 */

class Environment {
  constructor() {
    if (fs.existsSync(`${process.cwd()}/.env`)) {
      const result = dotenv.config()
      if (result.error) {
        throw result.error
      }
    }
    this.env = this.get('Q_ENV') || this.set("Q_ENV", "develop")

    this.app = {
      srcPath: this.get('Q_APP_SRC_PATH') || 'src',
      name: this.get('Q_APP_NAME')
    }

    this.node = {
      version: this.set(
        this._ccToENV('hostNodeVersion'),
        process.version.slice(1)
      )
    }

    this.host = {
      type: this.set(
        this._ccToENV('hostOsType', false),
        `"${os.type()}"`
      ),
      release: this.set(
        this._ccToENV('hostOsRelease', false),
        `"${os.release()}"`
      ),
      platform: this.set(
        this._ccToENV('hostOsPlatform', false),
        `"${os.platform()}"`
      ),
      arch: this.set(
        this._ccToENV('hostOsArch', false),
        `"${os.arch()}"`
      ),
      // TODO Add system mappings
      // const isWin = process.platform === 'win32';
      // const home = isWin ? process.env.USERPROFILE : process.env.HOME;

      npm: this.set(
        this._ccToENV('hostNpmVersion', false),
        `"${this._getSpawnOutput('npm')}"`
      ),
      yarn: this.set(
        this._ccToENV('hostYarnVersion', false),
        `"${this._getSpawnOutput('yarn')}"`
      ),
      quasar: this.set(
        this._ccToENV('hostQuasarVersion', false),
        `"${this._getSpawnOutput('quasar')}"`
      ),
      vue: this.set(
        this._ccToENV('hostVueVersion', false),
        `"${this._getSpawnOutput('vue')}"`
      ),
      cordova: this.set(
        this._ccToENV('hostCordovaVersion', false),
        `"${this._getSpawnOutput('cordova')}"`
      ),
      java: this.set(
        this._ccToENV('hostJavaVersion', false),
        process.env.JAVA_HOME
          ? `"${this._getSpawnOutput('java')}"`
          : false
      ),
      network: getExternalIPs().map(intf => {
        return this.set(`HOST_NETWORK_${intf.deviceName.toUpperCase().split(' ').join('_')}_IP`, intf.address)
      })
    }
    // this.network = getExternalIPs().map(intf => {
    //
    //   return {
    //     key: `  ${ intf.deviceName }`,
    //     value: chalk.green(intf.address)
    //   })
    // })
  }

  isSet(key) {
    return (typeof this.get(key) !== 'undefined')
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
    return process.env[key] = value
  }

  get(key) {
    return process.env[key]
  }

  // TODO: Build filter for matching specific variables
  getAll(verbose = false, all = false) {
    return Object.keys(process.env).filter((envKey) => {
      return all ? true : verbose
        ? (envKey.match(/^HOST_.*/g) || envKey.match(/^Q_.*/g))
        : (envKey.match(/^Q_.*/g) && typeof envKey.match(/^Q_.*/g).length !== 'undefined')
    }).map((envKey) => {
      return `${envKey}=${this.get(envKey)}`
    })
  }

  _getENV() {
    if (this.isSet('Q_ENV')) {
      return this.set('NODE_ENV', this.get('Q_ENV'))
    } else if (this.isSet('NODE_ENV')) {
      return this.get('NODE_ENV')
    } else {
      return 'develop'
    }
  }

  // TODO: Handle keys with multiple capital characters like keyENV
  _ccToENV(name, isQVar) {
    let prefix = isQVar
      ? 'Q_'
      : ''
    return `${prefix}${name.replace(/([A-Z])/g, ' $1')
      .toUpperCase()
      .split(' ')
      .join('_')}`
  }

  _getSpawnOutput(command) {
    let isJava = command === 'java'

    try {
      const child = spawn(command, [isJava ? '-version' : '--version'])
      return child.status === 0
        ? isJava
          ? String(child.output[2]).split('\n')[0].split(' ')[2].replace(/"/g, '').trim()
          : String(child.output[1]).trim()
        : 'Not installed'
    }
    catch (err) {
      return 'Not installed'
    }
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


/**
 * Messing around with maps,
 * Might be good to combine namespace_object and namespace into a _ccToENV refactor
 *   camel case:
 *      data: "someCamelCaseString"
 *      result: "Q_SOME_CAMEL_CASE_STRING"
 *   namespace:
 *      data: "some.namespace.string"
 *      result: "Q_SOME_NAMESPACE_STRING"
 *   namespace_object:
 *      data: {
 *          some: {
 *              namespace: "string"
 *          }
 *      }
 *      result: "Q_SOME_NAMESPACE_STRING"
 *
 * Core Variables
 *
 * Q_APP
 *  - NAME=
 *  - PROTOCOL=
 *  - HOST=
 *  - PORT=
 *  - SRC_PATH=
 *  - CORDOVA_SRC_PATH=
 *  - ELECTRON_SRC_PATH=
 *  - SSR_SRC_PATH=
 *  - PWA_SRC_PATH=
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
