import Base from './base'
import extend from 'extend'
import Util from 'gulp-util'

export const Default = {
  watch: false
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const TaskSequence = class extends Base {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, taskName, recipes, config = {}) {
    super(gulp, extend(true, {}, Default, config))

    // generate the task sequence
    let tasks = []
    for (let recipe of recipes) {
      if (this.config.watch) {
        tasks.push(recipe.watchTaskName())
      } else {
        tasks.push(recipe.taskName())
      }
    }

    this.debug(`Registering task: ${Util.colors.green(taskName)}`)
    this.gulp.task(taskName, tasks)
  }


  // ----------------------------------------------
  // protected

  // ----------------------------------------------
  // private

  // ----------------------------------------------
  // static

}

export default TaskSequence