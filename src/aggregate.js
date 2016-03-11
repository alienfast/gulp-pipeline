import BaseGulp from './baseGulp'
import Recipes from './util/recipes'
import Util from 'gulp-util'
import stringify from 'stringify-object'

const Default = {
  debug: false,
  watch: true  // register a watch task that aggregates all watches and runs the full sequence
}

const Aggregate = class extends BaseGulp {

  /**
   *
   * @param gulp - gulp instance
   * @param configs - customized overrides
   */
  constructor(gulp, taskName, recipes, ...configs) {
    super(gulp, Default, {task: {name: taskName}}, ...configs)
    this.recipes = recipes
    this.registerTask(this.taskName(), recipes)

    //if (this.config.watch) {
    //  this.registerWatchTask(this.watchTaskName(), recipes)
    //}
  }

  createHelpText() {
    //let taskNames = new Recipes().toTaskNames(this.recipes)
    //
    //// use the config to generate the dynamic help
    //return `Runs [${taskNames.join(', ')}]`
    return ''
  }

  createWatchHelpText() {
    let taskNames = this.watchableRecipes().reduce((a, b) => {
      return a.concat(b.taskName())
    }, [])

    return Util.colors.grey(`|___ aggregates watches from [${taskNames.join(', ')}] and runs full series`)
  }

  registerTask(taskName) {
    //let tasks = this.toTaskNames(this.recipes)
    //this.debug(`Registering task: ${Util.colors.green(taskName)} for ${stringify(tasks)}`)

    //this.taskFn = (done) => {
    //  return this.run(done, tasks)
    //}
    //this.gulp.task(taskName, this.taskFn)
    //this.taskFn.description = this.createHelpText()

    this.gulp.task(taskName, this.recipes)
    this.recipes.description = this.createHelpText()
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

  run(done, tasks) {
    // generate the task sequence
    return tasks
  }
}

export default Aggregate
