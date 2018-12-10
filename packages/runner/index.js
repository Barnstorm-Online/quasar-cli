const parseArgs = require('minimist')

/**
 * Definitions + Contexts:
 *
 * Client === An end user of the framework
 *
 * Client-Local-Run === Client Running *quasar cmds* in a Vue-Starter-Template/VueApp
 *   - Should extend the Vue CLI with Quasar features
 *     via injections like **quasar mode -a** when not in QuasarApp
 *
 * Client-Local-Runner === Client has Runners in <Q_APP_PATH>/bin
 *   - Should inject with specific override/extend/rebind
 *     paths such as <Q_APP_PATH>/bin/test/custom-runner will
 *     be loaded into the container as "@quasar/cli-test-custom-runner"
 *     unless there is a pkgName configuration key passed in
 *
 * Framework === All things Quasar including CLI/Framework repos
 *
 * Framework-Local-Run === Client Running *quasar cmds* in Quasar Modules
 *   - Needs a flag set for "framework" such as Q_FRAMEWORK=true and
 *     include rework of framework specific switches for things like
 *     **pnpm recursive** or **lerna** vs yarn/npm.
 *     Example: Q_FRAMEWORK=true; Q_PACKAGE_MANAGER=pnpm; quasar build
 *     Result: pnpm recursive build ->
 *          (local package build script) Q_FRAMEWORK=false Q_MODE=UMD quasar build
 *
 * Framework-Runner === Core Runner for all Commands
 *   - Should inject Vue CLI runner if quasar.conf.js
 *     not at <Q_APP_PATH> and Q_FRAMEWORK not set
 *   - Should load all existing package commands based on
 *     namespacing like **@quasar/cli-build** === **./bin/quasar-build**
 *     and **@quasar/cli-test** === **quasar-testing** then bind their
 *     Runner Classes to the core CLI Runner for using things like
 *     this.container.get('@quasar/cli-test').start()
 *     and if we want to override any existing classes we can do a
 *     this.rebind('@quasar/cli-test').to(MyNewClass). This will apply
 *     to local files as well under <Q_APP_PATH>/bin/cli-test-mynewclass
 */

const inversify = require('inversify')
require('reflect-metadata')
/**
 * Create the shared container
 * @type {Container}
 */
const CONTAINER = new inversify.Container()

/**
 * Namespace to use for all packages
 * @type {string}
 */
const ns = process.env.Q_PACKAGE_NAMESPACE || '@barnstorm/cli'

/**
 * Fallback location for local pcakages/commands
 * @type {string}
 */
const localCmds = './bin/barnstorm'

/**
 * Map a command to a source mapping of current and future
 * @param cmd
 * @param remote
 * @returns {{name: *, current: *, future: *}}
 */
function cmdMap (cmd, remote = false) {
  let meta = { name: cmd }
  if (!remote) {
    meta.current = `${localCmds}-${cmd}`
    meta.future = `${ns}-${cmd}`
  }
  else {
    meta.current = `${ns}-${cmd}`
  }
  return meta
}

/**
 * List of commands mapped to future: and current:
 * @type {{build, clean, dev, help, info, init, mode, new, serve, test}}
 */
const TOP_COMMANDS = {
  build: cmdMap('build'),
  clean: cmdMap('clean'),
  dev: cmdMap('dev'),
  help: cmdMap('help'),
  info: cmdMap('info'),
  init: cmdMap('init'),
  mode: cmdMap('mode'),
  new: cmdMap('new'),
  serve: cmdMap('serve'),
  test: cmdMap('test', true)
}
/**
 * Runner should load all available dependencies into each of the top level commands
 * this will look something like future=@quasar/cli-build that maps to
 * current=./bin/quasar-build.
 *
 * The main CLI script *quasar* injects a Runner with basic options and uses
 * the default init bootstrapping. This should automatically load all installed
 * dependencies into it's own container
 */
class Runner {
  /**
   * Runner takes a runner configuration instance
   * @param {RunnerConfig}
   */
  constructor ({ init = true, auto = false, sliceAt = 2, min = false, exit = true }) {
    this.shouldExit = exit
    /**
     * Inversify Container for loading Command's Dependencies
     * @type {inversify.Container}
     */
    this.container = CONTAINER
    /**
     * The command arguments array for this runner
     * @type {Array.<*>}
     */
    this.cmd = process.argv.slice(sliceAt)

    // Sanity check from configuration
    // if (!(this.cmd in allowed)) this.fail('Command is not allowed')
    // this.allowed = allowed

    // Bootstrap the instance
    if (init) this.init()
    if (min) this.argv = parseArgs(this.cmd, min)
    if (auto) this.start()
  }

  /**
   * Sanity check for available command and
   * bootstrap any installed local-consumer
   */
  init () {
    // TODO: Iron out this abstraction in vanilla js
    // https://github.com/inversify/inversify-vanillajs-helpers
    if (this.cmd in TOP_COMMANDS) {
      // this.container
    }
  }

  /**
   * Bind a package name to a Class
   * @param pkgName
   * @param Class
   */
  bind (pkgName, Class) {
    console.log(this)
    typeof this.container !== 'undefined'
      ? this.container.bind(pkgName).to(Class)
      : CONTAINER.bind(pkgName).to(Class)
  }

  /**
   * Rebind a package name to a class
   * @param pkgName
   * @param Class
   */
  rebind (pkgName, Class) {
    this.container.rebind(pkgName).to(Class)
  }

  /**
   * Find a package in your system
   * @param pkg
   */
  fetch (pkg) {
    // return this.container.get(pkg)
  }

  /**
   * Start Running
   */
  start () {
    console.log('Running a default task! You probably want to override this method!')
    this.stop()
  }

  /**
   * Stop running with an optional error
   * @param err
   */
  stop (err) {
    console.log('Stopping the program')
    if (this.shouldExit) process.exit(err)
  }

  /**
   * Display Failed Message and Stop
   */
  fail (err, throwable = false) {
    console.log('Failed')
    if (throwable) throw new Error(err)
    this.stop(err)
  }

  /**
   * Display Help Contents
   */
  help () {
    console.log('Help Docs')
  }
}

inversify.decorate(inversify.injectable(), Runner)

module.exports = Runner
