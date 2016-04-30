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

    super(gulp,
      extend(true, {},  // extend presets here since BaseGulp doesn't use preset.
        Default,
        {baseDirectories: preset.baseDirectories},
        Preset.resolveConfig(preset, ...configs)
      )
    )

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
      this.watchFn = (done) => {
        this.log(`[${Util.colors.green(name)}] watching ${this.config.watch.glob} ${stringify(this.config.watch.options)}...`)

        return this.gulp.watch(this.config.watch.glob, this.config.watch.options, () => {
          this.log(`Watched file changed, running ${this.taskName()}...`);
          return Promise
            .resolve(this.run(done, true))
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
    let taskFn = (done) => {
      //this.log(`Running task: ${Util.colors.green(name)}`)

      if (this.config.debug) {
        this.debugDump(`Executing ${Util.colors.green(this.displayName())} with config`, this.config)
      }
      return this.run(done)
    }

    // metadata for convenience so that gulp tasks show up with this instead of 'anonymous'
    taskFn.displayName = this.displayName()

    // assign it last so that displayName() can resolve this first as others may set it externally like <clean>
    this.taskFn = taskFn

    if (this.shouldRegisterTask()) {

      // set the description
      if (this.createDescription !== undefined) {
        this.config.task.description = this.createDescription()
      }

      // set metadata on fn for discovery by gulp
      this.taskFn.description = this.config.task.description


      // register
      let name = this.taskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)
      this.gulp.task(name, this.taskFn)
    }
  }

  shouldRegisterTask() {
    return (this.config.task && this.config.task.name)
  }

  displayName() {
    if (this.taskFn !== undefined && this.taskFn.displayName) {
      return this.taskFn.displayName
    }
    else if (this.shouldRegisterTask()) {
      return this.taskName()
    }
    else {
      // metadata for convenience so that gulp tasks show up with this instead of 'anonymous'
      return `<${this.constructor.name}>`
    }
  }

  logFinish(message = 'finished.') {
    this.log(`[${Util.colors.green(this.taskName())}] ${message}`)
  }

  debugOptions() { // this controls the gulp-debug log statement, created to mirror our #debug's log format
    return {title: `[${Util.colors.cyan('debug')}][${Util.colors.cyan(this.constructor.name)}]`}
  }
}

export default BaseRecipe
