import BaseClean from './baseClean'
import extend from 'extend'

export const Default = {
  presetType: 'images',
  task: {
    name: 'clean:images'
  }
}

const CleanImages = class extends BaseClean {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default, ...configs))
  }
}

export default CleanImages
