import BaseRecipe from './baseRecipe'
import Preset from './preset'

export const Default = {
  debug: false,
  presetType: 'javascripts'
}

const BaseMocha = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    // resolve watch cwd based on test cwd
    super(gulp, preset,
      Default,
      {watch: {options: {cwd: Preset.resolveConfig(preset, Default, ...configs).test.options.cwd}}},
      ...configs)
  }

  createDescription() {
    return `Tests ${this.config.test.options.cwd}/${this.config.test.glob}`
  }
}

export default BaseMocha
