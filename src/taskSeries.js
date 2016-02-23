import Base from './base'
import extend from 'extend'
import Util from 'gulp-util'
import stringify from 'stringify-object'

const Default = {
  debug: false,
  watch: true  // register a watch task that aggregates all watches and runs the full sequence
}

const TaskSeries = class extends Base {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, taskName, recipes, config = {}) {
    super(gulp, extend(true, {}, Default, config))
    this.recipes = recipes
    this.registerTask(taskName, recipes)

    if (this.config.watch) {
      this.registerWatchTask(`${taskName}:watch`, recipes)
    }
  }

  createHelpText() {
    let taskNames = this.flattenedRecipes().reduce((a, b) => {
      return a.concat(b.taskName());
    }, [])

    // use the config to generate the dynamic help
    return `Runs series [${taskNames.join(', ')}]`
  }

  createWatchHelpText() {
    let taskNames = this.watchableRecipes().reduce((a, b) => {
      return a.concat(b.taskName());
    }, [])

    return Util.colors.grey(`|___ aggregates watches from [${taskNames.join(', ')}] and runs full series`)
  }

  registerTask(taskName) {
    let tasks = this.toTaskNames(this.recipes)

    this.debugDump('this.recipes', this.recipes)
    this.debugDump('tasks', tasks)

    this.debug(`Registering task: ${Util.colors.green(taskName)} for ${stringify(tasks)}`)
    this.gulp.task(taskName, this.createHelpText(), () => {
      return this.run(tasks)
    })
  }

  flattenedRecipes() {
    let recipes = [].concat(...this.recipes)
    //this.debugDump(`flattenedRecipes`, recipes)
    return recipes
  }

  watchableRecipes() {
    // create an array of watchable recipes
    let watchableRecipes = []
    for (let recipe of this.flattenedRecipes()) {
      if (recipe.config.watch) {
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

  toTaskNames(recipes, tasks = []) {
    //this.debugDump(`toTaskNames`, recipes)
    for (let recipe of recipes) {
      //this.debugDump(`recipe taskName[${recipe.taskName? recipe.taskName() : ''}] isArray[${Array.isArray(recipe)}]`, recipe)
      if (Array.isArray(recipe)) {
        tasks.push(this.toTaskNames(recipe, []))
      }
      else {
        this.debug(`Adding to list ${recipe.taskName()}`)
        tasks.push(recipe.taskName())
      }
    }

    return tasks
  }

  // -----------------------------------
  // originally run-sequence code https://github.com/OverZealous/run-sequence
  // Copyright (c) 2014 [Phil DeJarnett](http://overzealous.com)
  // - Will be unnecessary with gulp 4.0
  // - Forced to include this/modify it as the #use(gulp) binding of the gulp instance didn't work with es class approach

  runSequence(...taskSets) {
    this.callBack = typeof taskSets[taskSets.length - 1] === 'function' ? taskSets.pop() : false
    this.debug(`currentTaskSet = null`)
    this.currentTaskSet = null
    this.verifyTaskSets(taskSets)
    this.taskSets = taskSets

    this.onEnd = (e) => this.onTaskEnd(e)
    this.onErr = (e) => this.onError(e)

    this.gulp.on('task_stop', this.onEnd)
    this.gulp.on('task_err', this.onErr)

    this.runNextSet()
  }

  finish(e) {
    this.debugDump(`finish`, e)
    this.gulp.removeListener('task_stop', this.onEnd)
    this.gulp.removeListener('task_err', this.onErr)

    let error = null
    if (e && e.err) {
      this.debugDump(`finish e`, e)
      //error = new Util.PluginError('run-sequence', {
      //  message: `An error occured in task [${e.task}].`
      //})
      error = {
        task: e.task,
        message: e.err,
        plugin: e.plugin || ''
      }
    }

    if (this.callback) {
      this.callback(error)
    }
    else if (error) {
      //this.log(Util.colors.red(error.toString()))
      this.notifyError(error)
    }
  }

  onError(err) {
    this.debugDump(`onError`, err)
    this.finish(err)
  }

  onTaskEnd(event) {
    this.debugDump(`onTaskEnd`, event)
    //this.debugDump(`this.currentTaskSet`, this.currentTaskSet)

    let i = this.currentTaskSet.indexOf(event.task)
    if (i > -1) {
      this.currentTaskSet.splice(i, 1)
    }
    if (this.currentTaskSet.length === 0) {
      this.runNextSet()
    }
  }

  runNextSet() {
    if (this.taskSets.length) {
      let command = this.taskSets.shift()
      if (!Array.isArray(command)) {
        command = [command]
      }
      this.debug(`currentTaskSet = ${command}`)
      this.currentTaskSet = command
      this.gulp.start(command)
    }
    else {
      this.finish()
    }
  }

  verifyTaskSets(taskSets, skipArrays, foundTasks = {}) {

    this.debug(`verifyTaskSets: ${stringify(taskSets)}`)

    if (taskSets.length === 0) {
      throw new Error('No tasks were provided to run-sequence')
    }

    for (let t of taskSets) {
      let isTask = (typeof t === "string")
      let isArray = !skipArrays && Array.isArray(t)

      if (!isTask && !isArray) {
        throw new Error(`Task ${t} is not a valid task string.`)
      }

      if (isTask && !this.gulp.hasTask(t)) {
        throw new Error(`Task ${t} is not configured as a task on gulp.`)
      }

      if (skipArrays && isTask) {
        if (foundTasks[t]) {
          throw new Error(`Task ${t} is listed more than once. This is probably a typo.`)
        }
        foundTasks[t] = true
      }

      if (isArray) {
        if (t.length === 0) {
          throw new Error(`An empty array was provided as a task set`)
        }
        this.verifyTaskSets(t, true, foundTasks)
      }
    }
  }
}

export default TaskSeries
