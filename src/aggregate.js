import BaseGulp from './baseGulp'
//import Recipes from './util/recipes'
import Util from 'gulp-util'

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
    this.registerTask(this.taskName())

    if (this.config.watch) {
      this.registerWatchTask(this.watchTaskName())
    }
  }

  createHelpText() {
    //let taskNames = new Recipes().toTasks(this.recipes)
    //
    //// use the config to generate the dynamic help
    //return `Runs [${taskNames.join(', ')}]`
    return ''
  }

  createWatchHelpText() {
    let taskNames = this.watchableRecipes().reduce((a, b) => {
      return a.concat(b.taskName())
    }, [])

    return Util.colors.grey(`|___ aggregates watches from [${taskNames.join(', ')}] and runs all tasks on any change`)
  }

  registerTask(taskName) {
    //let tasks = this.toTasks(this.recipes)
    //this.debug(`Registering task: ${Util.colors.green(taskName)} for ${stringify(tasks)}`)
    this.gulp.task(taskName, this.recipes)
    this.recipes.description = this.createHelpText()
  }

  registerWatchTask(taskName) {
    // generate watch task
    let watchableRecipes = this.watchableRecipes()
    if (watchableRecipes.length < 1) {
      this.debug(`No watchable recipes for task: ${Util.colors.green(taskName)}`)
      return
    }

    this.debug(`Registering task: ${Util.colors.green(taskName)}`)

    // on error ensure that we reset the flag so that it runs again
    this.gulp.on('error', () => {
      this.debug(`Yay! listened for the error and am able to reset the running flag!`)
      this.recipes.running = false
    })


    let watchFn = () => {
      // watch the watchable recipes and make them #run the series
      for (let recipe of watchableRecipes) {
        this.log(`[${Util.colors.green(taskName)}] watching for ${recipe.taskName()} ${recipe.config.watch.glob}...`)

        // declare this in here so we can use different display names in the log
        let runFn = (done) => {
          // ensure that multiple watches do not run the entire set of recipes multiple times on a single change
          if (this.recipes.running) {
            this.debug('Multiple matching watchers, skipping this one...')
            done()
            return
          }
          else {
            this.debug('Allowing it to run....')
            this.recipes.running = true
          }

          let finishFn = () => {
            this.log(`[${Util.colors.green(taskName)}] finished`)
            this.recipes.running = false
          }

          this.gulp.series(this.recipes, finishFn, done)()
        }
        runFn.displayName = `${recipe.taskName()} watcher`

        let watcher = this.gulp.watch(recipe.config.watch.glob, recipe.config.watch.options, runFn)
        let recipeName = Util.colors.grey(`(${recipe.taskName()})`)
        // add watchers for logging/information
        watcher.on('add', (path) => {
          if (!this.recipes.running) {
            this.log(`[${Util.colors.green(taskName)} ${recipeName}] ${path} was added, running...`)
          }
        })
        watcher.on('change', (path) => {
          if (!this.recipes.running) {
            this.log(`[${Util.colors.green(taskName)} ${recipeName}] ${path} was changed, running...`)
          }
        })
        watcher.on('unlink', (path) => {
          if (!this.recipes.running) {
            this.log(`[${Util.colors.green(taskName)} ${recipeName}] ${path} was deleted, running...`)
          }
        })
      }
    }


    watchFn.description = this.createWatchHelpText()
    this.gulp.task(taskName, watchFn)
  }

  flatten(list) {
    return list.reduce((a, b) =>
      // parallel and series set `.recipes` on the function as metadata
      a.concat((typeof b === "function" && b.recipes) ? this.flatten(b.recipes) : b), [])
  }

  flattenedRecipes() {
    let recipes = this.flatten([this.recipes])
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
}

export default Aggregate
