import RollupCjs from './rollupCjs'
import extend from 'extend'

export const Default = {
  task: {
    name: 'rollup:iife'
  },
  options: {
    //dest: '', // required
    format: 'iife'
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
const RollupIife = class extends RollupCjs {

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

export default RollupIife
