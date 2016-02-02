import Base from './base'
import extend from 'extend'
import Util from 'gulp-util'

const Default = {
  debug: true,
  watch: false
}

const TaskSequence = class extends Base {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, taskName, recipes, config = {}) {
    super(gulp, extend(true, {}, Default, config))

    this.registerTask(taskName, recipes)
  }

  registerTask(taskName, recipes){
// generate the task sequence
    let tasks = []
    let z = 0
    for (let recipe of recipes) {
      if (this.config.watch) {
        this.debug(`${z}: ${recipe.watchTaskName()}`)
        tasks.push(recipe.watchTaskName())
        this.debug(`${z}: ${recipe.watchTaskName()}`)
      } else {
        this.debug(`${z}: ${recipe.taskName()}`)
        tasks.push(recipe.taskName())
        this.debug(`${z}: ${recipe.taskName()}`)
      }
      z++
    }

    this.debug(`Registering task: ${Util.colors.green(taskName)}`)
    this.debugDump('tasks', tasks)
    this.gulp.task(taskName, tasks)
    this.log('done registering')  }
}

export default TaskSequence
