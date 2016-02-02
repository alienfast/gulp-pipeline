import BaseRecipe from './baseRecipe'
import extend from 'extend'
import del from 'del'

export const Default = {
  debug: true,
  watch: false
}

const BaseClean = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default, config))
  }

  run(watching = false) {
    return del(this.config.dest)
      .then((paths) => {
        this.log(`Deleted files and folders:\n${paths.join('\n')}`)
      })
      .catch((error) => {
        error.plugin = 'del'
        this.notifyError(error, watching)
      })
  }
}

export default BaseClean
