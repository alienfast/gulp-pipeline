import BaseRecipe from './baseRecipe'
import del from 'del'

export const Default = {
  presetType: `macro`, // allows direct instantiation
  debug: false,
  watch: false,
  sync: true  // necessary so that tasks can be run in a series, can be overriden for other purposes
}

const BaseClean = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default, ...configs)
  }

  createDescription(){
    // use the config to generate the dynamic help
    return `Cleans ${this.config.dest}`
  }

  run(done, watching = false) {
    if (this.config.sync) {
      let paths = del.sync(this.config.dest)
      this.logDeleted(paths)
    }
    else {
      return del(this.config.dest)
        .then((paths) => {
          this.logDeleted(paths)
        })
        .catch((error) => {
          error.plugin = 'del'
          this.notifyError(error, watching)
        })
    }

    this.donezo(done)
  }

  logDeleted(paths) {
    if (paths.length > 0) {
      this.log(`Deleted files and folders:`)
      for(let path of paths){
        this.log(`    ${path}`)
      }
    }
  }
}

export default BaseClean
