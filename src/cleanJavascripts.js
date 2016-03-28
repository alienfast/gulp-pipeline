import BaseClean from './baseClean'

export const Default = {
  presetType: 'javascripts',
  task: {
    name: 'clean:javascripts'
  },
  glob: '**/*.js'
}

const CleanJavascripts = class extends BaseClean {

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

export default CleanJavascripts
