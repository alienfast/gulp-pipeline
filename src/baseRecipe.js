import BaseGulp from './baseGulp'
import Preset from './preset'
import extend from 'extend'
import Util from 'gulp-util'
import stringify from 'stringify-object'

export const Default = {
  watch: true,
  debug: false
}

const BaseRecipe = class extends BaseGulp {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {

    super(gulp, extend(true, {},
      Default,
      {baseDirectories: preset.baseDirectories},
      Preset.resolveConfig(preset, ...configs)))

    // in case someone needs to inspect it later i.e. buildControl
    this.preset = preset

    if (this.createDescription !== undefined) {
      this.config.task.description = this.createDescription()
    }
    this.registerTask()
    this.registerWatchTask()
  }

  registerWatchTask() {
    if (this.config.watch) {
      // generate watch task e.g. sass:watch
      let name = this.watchTaskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)
      this.watchFn = () => {
        this.log(`[${Util.colors.green(name)}] watching ${this.config.watch.glob} ${stringify(this.config.watch.options)}...`)

        return this.gulp.watch(this.config.watch.glob, this.config.watch.options, (event) => {
          this.log(`File ${event.path} was ${event.type}, running ${this.taskName()}...`);
          return Promise
            .resolve(this.run(null, true))
            .then(() => this.logFinish())
        })
      }
      this.watchFn.description = this.createWatchDescription()
      this.gulp.task(name, this.watchFn)
    }
  }

  createWatchDescription() {
    return Util.colors.grey(`|___ watches ${this.config.watch.options.cwd}/${this.config.watch.glob}`)
  }

  registerTask() {
    if (this.config.task) {
      // generate primary task e.g. sass
      let name = this.taskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)

      // set a fn for use by the task, also used by aggregate/series/parallel
      this.taskFn = (done) => {
        //this.log(`Running task: ${Util.colors.green(name)}`)

        if (this.config.debug) {
          this.debugDump(`Executing ${Util.colors.green(name)} with options:`, this.config.options)
        }
        return this.run(done)
      }

      // set metadata on fn for discovery by gulp
      this.taskFn.displayName = name
      this.taskFn.description = this.config.task.description

      // register the task
      this.gulp.task(name, this.taskFn)
    }
  }

  taskName() {
    if (!this.config.task.name) {
      this.notifyError(`Expected ${this.constructor.name} to have a task name in the configuration.`)
    }
    return `${this.config.task.prefix}${this.config.task.name}${this.config.task.suffix}`
  }

  watchTaskName() {
    if (this.config.watch && this.config.watch.name) {
      return this.config.watch.name
    }
    else {
      return `${this.taskName()}:watch`
    }
  }

  logFinish(message = 'finished.') {
    this.log(`[${Util.colors.green(this.taskName())}] ${message}`)
  }
}

export default BaseRecipe
