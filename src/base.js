import extend from 'extend'
import Util from 'gulp-util'
import notify from 'gulp-notify'
import stringify from 'stringify-object'

export const Default = {
  watch: true,
  debug: false
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const Base = class {

  /**
   *
   * @param gulp
   * @param config
   */
  constructor(gulp, platform, config) {

    if(!platform){
      throw new Error(`Platform must be specified.  Please use one from the platform.js or specify a custom platform configuration.`)
    }

    if(!config || !config.platformType){
      throw new Error(`'platformType' must be specified in the config (usually the Default config).  See platform.js for a list of types such as javascripts, stylesheets, etc.`)
    }

    let platformTypeConfig = platform[config.platformType]
    if(!platformTypeConfig){
      throw new Error(`Unable to resolve configuration for platformType: ${config.platformType} from platform: ${stringify(platform)}`)
    }

    this.gulp = gulp
    this.config = extend(true, {}, Default, platformTypeConfig, config)


    //this.debug(`Using platformTypeConfig: ${stringify(platformTypeConfig)}`)
    this.debug(`[${this.constructor.name}] using resolved config: ${stringify(this.config)}`)
  }

  // ----------------------------------------------
  // protected
  log(msg) {
    Util.log(msg)
  }

  debug(msg) {
    if (this.config.debug) {
      this.log(`[${Util.colors.cyan('debug')}] ${msg}`)
    }
  }

  notifyError(error) {
    let lineNumber = (error.lineNumber) ? `Line ${error.lineNumber} -- ` : ''

    notify({
      title: `Task [${this.taskName()}] Failed in [${error.plugin}]`,
      message: `${lineNumber}See console.`,
      sound: 'Sosumi' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
    }).write(error)

    let tag = Util.colors.black.bgRed
    let report = `

${tag('    Task:')} [${Util.colors.cyan(this.taskName())}]
${tag('  Plugin:')} [${error.plugin}]
${tag('   Error:')}
${error.message}`

    if (error.lineNumber) {
      report += `${tag('    Line:')} ${error.lineNumber}\n`
    }
    if (error.fileName)   {
      report += `${tag('    File:')} ${error.fileName}\n`
    }
    this.log(report)

    // Prevent the 'watch' task from stopping
    this.gulp.emit('end')
  }

  // ----------------------------------------------
  // private

  // ----------------------------------------------
  // static

}

export default Base
