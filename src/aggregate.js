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

    let startFn = (event) => {

    }
    let finishFn = () => {
      this.log(`[${Util.colors.green(taskName)}] finished`)
    }

    //let runFn = this.gulp.series(
    //  startFn,
    //  this.recipes,
    //  finishFn
    //)
    this.runFn = (done) => {
      // ensure that multiple watches do not run the entire set of recipes multiple times on a single change
      if(this.running){
        this.debug('Already running, not running it again....')
        done()
        return
      }
      else{

        this.debug('NOT running, allowing it to run....')
        this.running = true
      }

      try{
        //return this.gulp.series(this.recipes(), finishFn)()
        this.recipes()
        done()
      }
      finally{
        this.running = false
      }
    }

    let watchFn = () => {
      // watch the watchable recipes and make them #run the series
      for (let recipe of watchableRecipes) {
        this.log(`[${Util.colors.green(taskName)}] watching ${recipe.taskName()} ${recipe.config.watch.glob}...`)



        let watcher = this.gulp.watch(recipe.config.watch.glob, recipe.config.watch.options, this.runFn)
        let recipeName = Util.colors.grey(`(${recipe.taskName()})`)
        // add watchers for logging/information
        watcher.on('add', (path) => {
          this.log(`[${Util.colors.green(taskName)} ${recipeName}] ${path} was added, running...`)
        })
        watcher.on('change', (path) => {
          this.log(`[${Util.colors.green(taskName)} ${recipeName}] ${path} was changed, running...`)
        })
        watcher.on('unlink', (path) => {
          this.log(`[${Util.colors.green(taskName)} ${recipeName}] ${path} was deleted, running...`)
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
