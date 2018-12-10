/**
 * The CLI Should:
 *   - Load Existing ENV variables
 *   - Check sanity of the system
 *   - Define High Level Interfaces
 *      ['init', 'dev', 'build','serve','test','deploy']
 *      ['@quasar/cli-init', '@quasar/cli-dev', ...]
 *   - Define Lower Level Interfaces
 *      ['init firebase', 'dev -m cordova', ...]
 *      ['@quasar/cli-init-firebase', '@quasar/cli-dev-mode-cordova', ...]
 *   - Define Plugin/Package install.
 *      ['mode -a firebase' AND/OR 'plugin add firebase' AND/OR 'npm install @quasar-plugin-firebase'] (possible refactor of modes to service)
 *      '@quasar/cli-plugin-firebase' includes:
 *      ['@quasar/cli-init-firebase', '@quasar/cli-mode-firebase']
 *   - Define Override/Extend abstraction in local package (./bin)
 *   - Load Dependencies:
 *     - Check for core built-in plugins/adapters/interfaces
 *     - Check for installed namespace plugin/adapters/interfaces
 *     - Check for partner plugins/adapters/interfaces (vue-cli)
 *   - Check sanity of the configuration
 *   - Alias VueCLI to Quasar-CLI
 *
 */

let builtin = [
  'build',
  'clean',
  'dev',
  'help',
  'info',
  'init',
  'mode',
  'new',
  'serve',
  // 'test',
  // 'deploy'
]

describe('RFC - IoC/DI+Testing aka the Singularity', () => {
  it('should load existing ENV variables', () => {
    // Leverage useful ENV Variables
    console.log(process.env.Q_TEST_DIRNAME)
  })

  it('should check sanity of the system', () => {
    // Check node/yarn/etc
    console.log(process.env.Q_NODE_PACKAGER)
    console.log(process.env.NODE_ENV)
    console.log(process.env.NODE_VERSION)
  })

  describe(' - Builtin Interfaces', () => {
    // Sanity check for builtins
    builtin.forEach((cmd) => {
      it(`should have a high level ${cmd} command`, () => {
        // Check that it has a command
        console.log(`spy on: quasar ${cmd}`)
      })

      if (cmd === 'init') {
        [
          'electron',
          'cordova',
          'repoURL'
        ].forEach((iFace) => {
          it(`should have interface ${iFace} for ${cmd} command`, () => {
            // Check that it has a command
          })
        })
      }
    })
    // Define Lower Level Interfaces
    // *      ['init firebase', 'dev -m cordova', ...]
    // *      ['@quasar/cli-init-firebase', '@quasar/cli-dev-mode-cordova', ...]
  })
})
