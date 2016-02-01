import RollupCjs from './rollupCjs'
import extend from 'extend'

export const Default = {
  task: {
    name: 'rollup:umd'
  },
  options: {
    //dest: '', // required
    format: 'umd',
  }
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const RollupUmd = class extends RollupCjs {

  /**
   *
   * @param gulp - gulp instance
   * @param platform - base platform configuration - either one from platform.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, platform, config = {}) {
    super(gulp, platform, extend(true, {}, Default, config))
  }
}

export default RollupUmd
