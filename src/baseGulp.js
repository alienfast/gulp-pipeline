import Base from './base'
import gulpHelp from 'gulp-help'
import console from 'console'
import notify from 'gulp-notify'
import Util from 'gulp-util'

export const Default = {
  watch: true,
  debug: false
}

const BaseGulp = class extends Base {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, ...configs) {
    super(...configs)
    this.gulp = gulpHelp(gulp, {afterPrintCallback: () => console.log(`For configuration help see https://github.com/alienfast/gulp-pipeline \n`)}) // eslint-disable-line no-console
  }

  notifyError(error, watching = false) {
    let lineNumber = (error.lineNumber) ? `Line ${error.lineNumber} -- ` : ''
    let taskName = error.task || this.taskName()

    let title = `Task [${taskName}] failed`
    if (error.plugin) {
      title += ` in [${error.plugin}]`
    }

    notify({
      title: title,
      message: `${lineNumber}See console.`,
      sound: 'Sosumi' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
    }).write(error)

    let tag = Util.colors.black.bgRed
    let report = `\n${tag('    Task:')} [${Util.colors.cyan(taskName)}]\n`

    if (error.plugin) {
      report += `${tag('  Plugin:')} [${error.plugin}]\n`
    }

    report += `${tag('   Error:')} `

    if (error.message) {
      report += `${error.message}\n`
    }
    else {
      report += `${error}\n`
    }

    if (error.lineNumber) {
      report += `${tag('    Line:')} ${error.lineNumber}\n`
    }

    if (error.fileName) {
      report += `${tag('    File:')} ${error.fileName}\n`
    }
    this.log(report)

    // Prevent the 'watch' task from stopping
    if (!watching && this.gulp) {
      this.gulp.emit('end')
    }
    else {
      throw error
    }
  }
}

export default BaseGulp
