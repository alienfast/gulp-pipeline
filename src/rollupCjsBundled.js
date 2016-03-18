import RollupCjs from './rollupCjs'

export const Default = {
  task: {
    name: 'rollup:cjs-bundled'
  },
  nodeResolve: {
    enabled: true // bundle a full package with dependencies? (if not use RollupCjs itself)
  },
  commonjs: {
    enabled: true // convert dependencies to commonjs modules for rollup
  }
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const RollupCjsBundled = class extends RollupCjs {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default, ...configs)
  }
}

export default RollupCjsBundled
