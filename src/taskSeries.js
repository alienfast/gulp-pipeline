import Base from './base'
import extend from 'extend'
import Util from 'gulp-util'
import stringify from 'stringify-object'
import runSequence from 'run-sequence'

const Default = {
  debug: true,
  watch: false
}

const TaskSeries = class extends Base {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, taskName, recipes, config = {}) {
    super(gulp, extend(true, {}, Default, config))

    // generate the task sequence
    let tasks = []
    this.toTaskNames(recipes, tasks);

    this.debug(`Registering task: ${Util.colors.green(taskName)} for ${stringify(tasks)}`)

    this.gulp.task(taskName, runSequence(tasks))
  }


  toTaskNames(recipes, tasks) {
    for (let recipe of recipes) {
      if (Array.isArray(recipe)) {
        let series = []
        this.toTaskNames(recipe, series)
        tasks.push(series)
      }
      else {
        if (this.config.watch) {
          tasks.push(recipe.watchTaskName())
        } else {
          tasks.push(recipe.taskName())
        }
      }
    }
  }
}

export default TaskSeries
