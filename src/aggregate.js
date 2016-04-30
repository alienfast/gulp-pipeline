import BaseGulp from './baseGulp'
//import Recipes from './util/recipes'
import Util from 'gulp-util'

const Default = {
  debug: false,
  watch: true  // register a watch task that aggregates all watches and runs the full sequence

  // watch can also specify an additional path i.e. spec/dummy app watching parent sources
  // watch: { glob: '**/*.scss', options: { cwd: '../../' } }
}

const Aggregate = class extends BaseGulp {

  /**
   *
   * @param gulp - gulp instance
   * @param configs - customized overrides
   */
  constructor(gulp, taskName, recipes, ...configs) {
    super(gulp, Default, {task: {name: taskName}}, ...configs)

    if (Array.isArray(recipes)) {
      this.notifyError(`recipes must not be an array, but a function, series, or parallel, found: ${recipes}`)
    }

    // track recipes as taskFn so that aggregates can be included and resolved as part of other aggregates just like recipes
    this.taskFn = recipes

    // track recipes as `recipes` like series/parallel so metadata can be discovered
    //this.taskFn.recipes = recipes

    this.registerTask(this.taskName())

    if (this.config.watch) {
      this.registerWatchTask(this.watchTaskName())
    }
  }

  createHelpText() {
    //let taskNames = new Recipes().toTasks(this.taskFn)
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
    //let tasks = this.toTasks(this.taskFn)
    //this.debug(`Registering task: ${Util.colors.green(taskName)} for ${stringify(tasks)}`)
    this.gulp.task(taskName, this.taskFn)
    this.taskFn.description = this.createHelpText()
  }

  registerWatchTask(taskName) {
    // generate watch task
    if (this.watchableRecipes().length < 1) {
      this.debug(`No watchable recipes for task: ${Util.colors.green(taskName)}`)
      return
    }

    this.debug(`Registering task: ${Util.colors.green(taskName)}`)

    // on error ensure that we reset the flag so that it runs again
    this.gulp.on('error', () => {
      this.debug(`Yay! listened for the error and am able to reset the running flag!`)
      this.taskFn.running = false
    })

    let watchFn = () => {
      // watch the watchable recipes and make them #run the series
      for (let recipe of this.watchableRecipes()) {
        this.addWatch(taskName, recipe)
      }

      // this aggregate may be configured with additional watch
      if (this.config.watch.glob) {
        this.addWatch(taskName, this)
      }
    }

    watchFn.description = this.createWatchHelpText()
    this.gulp.task(taskName, watchFn)
  }

  addWatch(taskName, recipe) {
    let recipeName = Util.colors.grey(`(${recipe.taskName() || recipe.constructor.name || 'anonymous'})`)
    let logPrefix = `[${Util.colors.green(taskName)} ${recipeName}]`
    let msg = `${logPrefix} watching`
    if (recipe.config.watch.options) {
      msg += ` ${recipe.config.watch.options.cwd} for ${recipe.config.watch.glob}...`
    }
    this.log(msg)

    // declare this in here so we can use different display names in the log
    let runFn = (done) => {
      // ensure that multiple watches do not run the entire set of recipes multiple times on a single change
      if (this.taskFn.running) {
        this.debug('Multiple matching watchers, skipping this one...')
        done()
        return
      }
      else {
        this.debug('Allowing it to run....')
        this.taskFn.running = true
      }

      // let finishFn = (done) => {
      //   this.log(`${logPrefix} finished`)
      //   this.taskFn.running = false
      //   done()
      // }

      // this.gulp.series(this.taskFn, /*finishFn,*/ done)()
      return this.taskFn(done)
    }
    runFn.displayName = `${recipe.taskName()} watcher`

    let watcher = this.gulp.watch(recipe.config.watch.glob, recipe.config.watch.options, runFn)
    // add watchers for logging/information
    watcher.on('error', (a, b) => {
      this.log(`Error via watcher a: ${a}`)
      this.log(`Error via watcher b: ${b}`)
      this.log(`arguments.length: ${arguments.length}`)
      // this.notifyError(`${logPrefix} ${error}`)
    })

    watcher.on('add', (path) => {
      if (!this.taskFn.running) {
        this.log(`${logPrefix} ${path} was added, running...`)
      }
    })

    watcher.on('change', (path) => {
      if (!this.taskFn.running) {
        this.log(`${logPrefix} ${path} was changed, running...`)
      }
    })
    watcher.on('unlink', (path) => {
      if (!this.taskFn.running) {
        this.log(`${logPrefix} ${path} was deleted, running...`)
      }
    })
  }


  flatten(list) {
    // parallel and series set `.recipes` on the function as metadata
    let callback = (prev, current) => {
      let item = current

      // Flatten any series/parallel
      if (typeof current === "function" && current.recipes) {
        this.debugDump(`flatten function recipes`, current.recipes)
        item = this.flatten(current.recipes)
      }
      // Flatten any Aggregate object - exposes a taskFn (which should be a series/parallel)
      else if (current.taskFn && current.taskFn.recipes) {
        this.debugDump(`flatten ${current.constructor.name} with taskFn.recipes`, current.taskFn.recipes)
        item = this.flatten(current.taskFn.recipes)
      }
      //else {
      //  if (current.taskFn) {
      //    this.debugDump(`flatten something WITH taskFn`, current)
      //
      //    if(current.taskFn.recipes){
      //      this.debugDump(`flatten something WITH taskFn.recipes`, current.taskFn.recipes)
      //    }
      //  }
      //  else if (current.recipes) {
      //    this.debugDump(`flatten something WITH recipes but not a fn`, current)
      //  }
      //  else if (current && current.constructor) {
      //    this.debugDump(`flatten ${current.constructor.name} with no recipes`, current)
      //  }
      //  else if (Array.isArray(current)) {
      //    this.debugDump(`flatten array with no recipes`, current)
      //  }
      //  else {
      //    this.debugDump(`flatten ???`, current)
      //  }
      //}
      return prev.concat(item)
    }

    return list.reduce(callback, [])


  }

  flattenedRecipes() {
    let recipes = this.flatten([this.taskFn])
    this.debugDump(`flattenedRecipes`, recipes)
    return recipes
  }

  watchableRecipes() {
    // create an array of watchable recipes
    let watchableRecipes = []
    for (let recipe of this.flattenedRecipes()) {
      if ((typeof recipe !== "string") && (typeof recipe !== "function") && recipe.config.watch) {
        watchableRecipes.push(recipe)
      }
    }
    return watchableRecipes
  }
}

export default Aggregate
