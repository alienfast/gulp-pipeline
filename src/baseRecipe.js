import Base from './base'
import extend from 'extend'
import Util from 'gulp-util'
import stringify from 'stringify-object'

export const Default = {
  watch: true,
  debug: false,
  task: {
    help: ''
  }
}

const BaseRecipe = class extends Base {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config) {

    if (!preset) {
      throw new Error(`Preset must be specified.  Please use one from the preset.js or specify a custom preset configuration.`)
    }

    if (!config || !config.presetType) {
      throw new Error(`'presetType' must be specified in the config (usually the Default config).  See preset.js for a list of types such as javascripts, stylesheets, etc.`)
    }

    let presetTypeConfig = null
    if (config.presetType !== 'macro') {
      presetTypeConfig = preset[config.presetType]
      if (!presetTypeConfig) {
        throw new Error(`Unable to resolve configuration for presetType: ${config.presetType} from preset: ${stringify(preset)}`)
      }
    }
    else {
      presetTypeConfig = {}
    }

    super(gulp, extend(true, {}, Default, presetTypeConfig, config))
    if(this.createHelpText !== undefined) {
      this.config.task.help = this.createHelpText()
    }
    this.registerTask()
    this.registerWatchTask()
  }

  //createHelpText(){
  //  // empty implementation that can dynamically create help text instead of the static config.task.help
  //}

  registerWatchTask() {
    if (this.config.watch) {
      // generate watch task e.g. sass:watch
      let name = this.watchTaskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)
      this.gulp.task(name, this.createWatchHelpText(), () => {
        this.log(`[${Util.colors.green(name)}] watching ${this.config.watch.glob} ${stringify(this.config.watch.options)}...`)

        return this.gulp.watch(this.config.watch.glob, this.config.watch.options, (event) => {
          this.log(`File ${event.path} was ${event.type}, running ${this.taskName()}...`);
          return Promise
            .resolve(this.run(true))
            .then(() => this.logFinish())
        })
      })
    }
  }

  createWatchHelpText(){
    return Util.colors.grey(`|___ watches ${this.config.watch.options.cwd}/${this.config.watch.glob}`)
  }


  registerTask() {
    if (this.config.task) {
      // generate primary task e.g. sass
      let name = this.taskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)
      this.gulp.task(name, this.config.task.help, () => {
        //this.log(`Running task: ${Util.colors.green(name)}`)
        return this.run()
      })
    }
  }

  taskName() {
    return this.config.task.name || this.constructor.name // guarantee something is present for error messages
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
