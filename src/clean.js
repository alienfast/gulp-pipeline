import Base from './base'
import extend from 'extend'
import CleanImages from './cleanImages'
import CleanStylesheets from './cleanStylesheets'
import CleanJavascripts from './cleanJavascripts'
import TaskSequence from './taskSequence'

const Default = {
  debug: true,
  task: {
    name: 'clean'
  }
}

const Clean = class extends Base {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, extend(true, {}, Default, config))

    let recipes = [
      new CleanImages(gulp, preset),
      new CleanStylesheets(gulp, preset),
      new CleanJavascripts(gulp, preset)
    ]

    //let z = 0
    //for (let recipe of recipes) {
    //  this.debug(`${z}: ${recipe.taskName()}`)
    //  z++
    //}

    new TaskSequence(gulp, this.config.task.name, recipes)
    //new TaskSequence(gulp, 'clean', recipes)
  }
}

export default Clean
