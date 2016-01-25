import extend from 'extend'
import Util from 'gulp-util'
import notify from 'gulp-notify'

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
  constructor(gulp, config) {
    this.gulp = gulp
    this.config = extend(true, {}, Default, config)
  }

  // ----------------------------------------------
  // protected
  log(msg) {
    Util.log(msg)
  }

  debug(msg) {
    if (this.config.debug) {
      this.log(msg)
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
