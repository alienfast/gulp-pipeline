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
    // generate primary task e.g. sass

    // set a fn for use by the task, also used by aggregate/series/parallel
    this.taskFn = (done) => {
      //this.log(`Running task: ${Util.colors.green(name)}`)

      if (this.config.debug) {
        this.debugDump(`Executing ${Util.colors.green(this.taskName())} with options:`, this.config.options)
      }
      return this.run(done)
    }

    if (this.config.task && this.config.task.name) {
      let name = this.taskName()
      if (this.createDescription !== undefined) {
        this.config.task.description = this.createDescription()
      }

      this.debug(`Registering task: ${Util.colors.green(name)}`)

      // set metadata on fn for discovery by gulp
      this.taskFn.displayName = name
      this.taskFn.description = this.config.task.description

      // register the task
      this.gulp.task(name, this.taskFn)
    }
    else {
      // metadata for convenience so that gulp tasks show up with this instead of 'anonymous'
      this.taskFn.displayName = `<${this.constructor.name}>`
    }
  }

  logFinish(message = 'finished.') {
    this.log(`[${Util.colors.green(this.taskName())}] ${message}`)
  }
}

export default BaseRecipe
