import RollupEs from './rollupEs'
import Preset from './preset'
import babel from 'rollup-plugin-babel';

export const Default = {
  task: {
    name: 'rollup:cjs'
  },
  presetType: 'javascripts',
  babel: {
    babelrc: false,
    presets: ['es2015-rollup']
  },
  options: {
    //dest: '', // required
    format: 'cjs'
    //plugins: [babel({
    //  babelrc: false,
    //  presets: ['es2015-rollup']
    //})]
  },
  nodeEnvReplace: {
    enabled: false // building for react in the browser?
  },
  nodeResolve: {
    enabled: false // bundle a full package with dependencies?
  },
  commonjs: {
    enabled: false // convert dependencies to commonjs modules for rollup
  }
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const RollupCjs = class extends RollupEs {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    let config = Preset.resolveConfig(preset, Default, ...configs)
    super(gulp, preset, Default, {
        options: {
          plugins: [babel(config.babel)]
        }
      },
      ...configs)
  }
}

export default RollupCjs
