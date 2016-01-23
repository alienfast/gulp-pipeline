import extend from 'extend'

const BaseRecipe = (() => {

  const Default = {}

  /**
   * ----------------------------------------------
   * Class Definition
   * ----------------------------------------------
   */
  class Base {

    /**
     *
     * @param gulp
     * @param config
     */
    constructor(gulp, config) {
      this.gulp = gulp
      this.config = extend(true, {}, Default, config)

      this.registerTasks()
    }

    taskName() {
      return this.config.task
    }

    watchTaskName() {
      return `${this.taskName()}:watch`
    }

    registerTasks() {
      // generate primary task e.g. sass
      this.gulp.task(this.taskName(), () => {
        this.run()
      })

      if (this.config.watch) {
        // generate watch task e.g. sass:watch
        this.gulp.task(this.watchTaskName(), () => {
          this.watch()
        })
      }
    }

    watch() {
      this.gulp.watch(this.config.watch, [this.taskName()])
    }

    // ----------------------------------------------
    // protected

    // ----------------------------------------------
    // private

    // ----------------------------------------------
    // static

  }

  return Base

})()

export default BaseRecipe
