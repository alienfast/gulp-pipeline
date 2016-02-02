import Base from './base'
import extend from 'extend'
import Util from 'gulp-util'
import stringify from 'stringify-object'

export const Default = {
  watch: true,
  debug: false
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const BaseRecipe = class extends Base {

  /**
   *
   * @param gulp - gulp instance
   * @param platform - base platform configuration - either one from platform.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, platform, config) {

    if(!platform){
      throw new Error(`Platform must be specified.  Please use one from the platform.js or specify a custom platform configuration.`)
    }

    if(!config || !config.platformType){
      console.log(`${stringify(config)}`)
      throw new Error(`'platformType' must be specified in the config (usually the Default config).  See platform.js for a list of types such as javascripts, stylesheets, etc.`)
    }

    let platformTypeConfig = platform[config.platformType]
    if(!platformTypeConfig){
      throw new Error(`Unable to resolve configuration for platformType: ${config.platformType} from platform: ${stringify(platform)}`)
    }

    super(gulp, extend(true, {}, Default, platformTypeConfig, config))

    if (this.config.task) {
      // generate primary task e.g. sass
      let name = this.taskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)
      this.gulp.task(name, () => {
        this.run()
      })
    }

    if (this.config.watch) {
      // generate watch task e.g. sass:watch
      let name = this.watchTaskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)
      this.gulp.task(name, () => {
        this.watch()
      })
    }
  }

  taskName() {
    return this.config.task.name || this.constructor.name // guarantee something is present for error messages
  }

  watchTaskName() {
    if (this.config.watch && this.config.watch.name) {
      return this.config.watch.name
    }
    else {
      return `${this.taskName()}:watch`
    }
  }

  watch() {
    this.gulp.watch(this.config.source.glob, this.config.source.options, [this.taskName()])
  }

  // ----------------------------------------------
  // protected

  conditionalDebug(){

  }
  // ----------------------------------------------
  // private

  // ----------------------------------------------
  // static

}

export default BaseRecipe
