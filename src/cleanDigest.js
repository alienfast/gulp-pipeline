import BaseClean from './baseClean'
import extend from 'extend'

export const Default = {
  presetType: 'digest',
  task: {
    name: 'clean:digest'
  }
}

const CleanDigest = class extends BaseClean {

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

export default CleanDigest