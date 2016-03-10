import BaseGulp from './baseGulp'
import extend from 'extend'
import Util from 'gulp-util'
import stringify from 'stringify-object'

const Default = {
  debug: false,
  watch: true  // register a watch task that aggregates all watches and runs the full sequence
}

const TaskSeries = class extends BaseGulp {

  /**
   *
   * @param gulp - gulp instance
   * @param configs - customized overrides
   */
  constructor(gulp, taskName, recipes, ...configs) {
    super(gulp, extend(true, {}, Default, {task: {name: taskName}}, ...configs))
    this.recipes = recipes
    this.registerTask(this.taskName(), recipes)

    if (this.config.watch) {
      this.registerWatchTask(this.watchTaskName(), recipes)
    }
  }

  createHelpText() {
    let taskNames = this.flattenedRecipes().reduce((a, b) => {
      return a.concat(this.toTaskName(b))
    }, [])

    // use the config to generate the dynamic help
    return `Runs series [${taskNames.join(', ')}]`
  }

  createWatchHelpText() {
    let taskNames = this.watchableRecipes().reduce((a, b) => {
      return a.concat(b.taskName())
    }, [])

    return Util.colors.grey(`|___ aggregates watches from [${taskNames.join(', ')}] and runs full series`)
  }

  registerTask(taskName) {
    let tasks = this.toTaskNames(this.recipes)

    this.debug(`Registering task: ${Util.colors.green(taskName)} for ${stringify(tasks)}`)
    this.gulp.task(taskName, this.createHelpText(), () => {
      return this.run(tasks)
    })
  }

  flatten(list) {
    return list.reduce(
      (a, b) => a.concat(Array.isArray(b) ? this.flatten(b) : b), []
    )
  }

  flattenedRecipes() {
    let recipes = this.flatten(this.recipes)
    this.debugDump(`flattenedRecipes`, recipes)
    return recipes
  }

  watchableRecipes() {
    // create an array of watchable recipes
    let watchableRecipes = []
    for (let recipe of this.flattenedRecipes()) {
      if ((typeof recipe !== "string") && recipe.config.watch) {
        watchableRecipes.push(recipe)
      }
    }
    return watchableRecipes
  }

  registerWatchTask(taskName, recipes) {
    // generate watch task
    let watchableRecipes = this.watchableRecipes()
    if (watchableRecipes.length < 1) {
      this.debug(`No watchable recipes for task: ${Util.colors.green(taskName)}`)
      return
    }

    this.debug(`Registering task: ${Util.colors.green(taskName)}`)
    this.gulp.task(taskName, this.createWatchHelpText(), () => {

      // watch the watchable recipes and make them #run the series
      for (let recipe of watchableRecipes) {
        this.log(`[${Util.colors.green(taskName)}] watching ${recipe.taskName()} ${recipe.config.watch.glob}...`)
        this.gulp.watch(recipe.config.watch.glob, recipe.config.watch.options, (event) => {
          this.log(`[${Util.colors.green(taskName)}] ${event.path} was ${event.type}, running series...`);
          return Promise
            .resolve(this.run(recipes))
            .then(() => this.log(`[${Util.colors.green(taskName)}] finished`))
        })
      }
    })
  }

  run(tasks) {
    // generate the task sequence
    return this.runSequence(...tasks)
  }

  toTaskName(recipe) {
    let taskName = null
    if (typeof recipe === "string") {
      taskName = recipe
    }
    else {
      taskName = recipe.taskName()
    }
    return taskName
  }

  toTaskNames(recipes, tasks = []) {
    //this.debugDump(`toTaskNames`, recipes)
    for (let recipe of recipes) {
      //this.debugDump(`recipe taskName[${recipe.taskName? recipe.taskName() : ''}] isArray[${Array.isArray(recipe)}]`, recipe)
      if (Array.isArray(recipe)) {
        tasks.push(this.toTaskNames(recipe, []))
      }
      else {
        let taskName = this.toTaskName(recipe)
        this.validateTaskString(taskName)
        this.debug(`Adding to list ${taskName}`)
        tasks.push(taskName)
      }
    }

    return tasks
  }

  validateTaskString(taskName) {
    let isString = (typeof taskName === "string")

    if (!isString) {
      throw new Error(`Task ${taskName} is not a string.`)
    }

    if (isString && !this.gulp.hasTask(taskName)) {
      throw new Error(`Task ${taskName} is not configured task in gulp.`)
    }
  }
}

export default TaskSeries
