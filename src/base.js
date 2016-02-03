import extend from 'extend'
import Util from 'gulp-util'
import notify from 'gulp-notify'
import stringify from 'stringify-object'

export const Default = {
  watch: true,
  debug: false
}

const Base = class {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, config) {
    this.gulp = gulp
    this.config = extend(true, {}, Default, config)
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

  debugDump(msg, obj){
    this.debug(`${msg}:\n${stringify(obj)}`)
  }

  notifyError(error, watching = false) {
    let lineNumber = (error.lineNumber) ? `Line ${error.lineNumber} -- ` : ''
    let taskName = error.task || this.taskName()

    notify({
      title: `Task [${taskName}] Failed in [${error.plugin}]`,
      message: `${lineNumber}See console.`,
      sound: 'Sosumi' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
    }).write(error)

    let tag = Util.colors.black.bgRed
    let report = `

${tag('    Task:')} [${Util.colors.cyan(taskName)}]
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
    if(!watching) {
      this.gulp.emit('end')
    }
  }

  debugOptions() {
    return {title: `[${Util.colors.cyan('debug')}][${Util.colors.cyan(this.taskName())}]`}
  }
}

export default Base
