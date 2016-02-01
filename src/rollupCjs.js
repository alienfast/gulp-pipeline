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
   * @param platform - base platform configuration - either one from platform.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, platform, config = {}) {
    super(gulp, platform, extend(true, {}, Default, config))
  }
}

export default RollupCjs
