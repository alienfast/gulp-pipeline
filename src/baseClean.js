import BaseRecipe from './baseRecipe'
import Preset from './preset'
import del from 'del'

export const Default = {
  presetType: `macro`, // allows direct instantiation
  debug: false,
  task: false,
  watch: false,
  sync: true,  // necessary so that tasks can be run in a series, can be overriden for other purposes
  options: {}
}

const BaseClean = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    let config = Preset.resolveConfig(preset, Default, ...configs)
    let destGlob = {} // assume no glob - directory and contents will be deleted
    if(config.glob){
      destGlob = {dest: `${config.dest}/${config.glob}`}
    }
    super(gulp, preset, config, destGlob)
  }

  createDescription(){
    // use the config to generate the dynamic help
    return `Cleans ${this.config.dest}`
  }

  run(done, watching = false) {
    if (this.config.sync) {
      this.debug(`deleting ${this.config.dest}`)
      let paths = del.sync(this.config.dest, this.config.options)
      this.logDeleted(paths)
    }
    else {
      this.debug(`deleting ${this.config.dest}`)
      return del(this.config.dest, this.config.options)
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
