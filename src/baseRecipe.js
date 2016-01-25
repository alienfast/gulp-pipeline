import extend from 'extend'
import Util from 'gulp-util'

export const Default = {
  watch: true,
  debug: false
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const BaseRecipe = class {

  /**
   *
   * @param gulp
   * @param config
   */
  constructor(gulp, config) {
    this.gulp = gulp
    this.config = extend(true, {}, Default, config)

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
    return this.config.task.name
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
    this.gulp.watch(this.config.watch.glob, [this.taskName()])
  }

  // ----------------------------------------------
  // protected
  log(msg) {
    Util.log(msg)
  }

  debug(msg){
    if(this.config.debug){
      this.log(msg)
    }
  }

  // ----------------------------------------------
  // private

  // ----------------------------------------------
  // static

}

export default BaseRecipe
