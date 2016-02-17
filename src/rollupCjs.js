import RollupEs from './rollupEs'
import extend from 'extend'
import babel from 'rollup-plugin-babel';

export const Default = {
  task: {
    name: 'rollup:cjs'
  },
  options: {
    //dest: '', // required
    format: 'cjs',
    plugins: [babel({
      babelrc: false,
      presets: ['es2015-rollup']
    })]
  },
  // by nature, iife is the full package so bundle up those dependencies.
  nodeResolve: {
    enabled: true
  },
  commonjs: { // convert commonjs modules for rollup
    enabled: true
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default, config))
  }
}

export default RollupCjs
