import Base from './base'
import notify from 'gulp-notify'
import Util from 'gulp-util'

export const Default = {
  debug: false,
  watch: true,
  task: {
    name: undefined,
    description: '',
    prefix: '', // task name prefix
    suffix: ''  // task name suffix
  }
}

const BaseGulp = class extends Base {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, ...configs) {
    super(Default, ...configs)
    this.requireValue(gulp, 'gulp')
    this.gulp = gulp
  }

  taskName() {
    if (!this.config.task || !this.config.task.name) {
      return ''
    }

    //if (!this.config.task.name) {
    //  this.notifyError(`Expected ${this.constructor.name} to have a task name in the configuration.`)
    //}
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

  notifyError(error, done, watching = false) {
    let isWatching = (this.gulp ? this.gulp.watching : undefined) || watching
    this.debug(`isWatching: ${isWatching}`)
    //this.debugDump('notifyError', error)

    let lineNumber = (error.lineNumber) ? `Line ${error.lineNumber} -- ` : ''
    let taskName = error.task || ((this.config.task && this.config.task.name) ? this.taskName() : this.constructor.name)

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
    if (isWatching) {
        // do nothing
      this.debug(`notifyError: watching, so not doing anything`)
    }
    else if (this.gulp) {
      // if this is not used, we see "Did you forget to signal async completion?", it also unfortunately logs more distracting information below.  But we need to exec the callback with an error to halt execution.
      this.donezo(done, error)
    }
    else {
      this.debug(`notifyError: throwing error`)
      throw error
    }
  }

  /**
   * if done is provided, run it
   *
   * @param done
   */
  donezo(done, error = null) {
    if (done) {
      if (error) {
        this.debug('executing callback with error')
        done(error)
      }
      else {
        this.debug('executing callback without error')
        done()
      }
    }
    else {
      this.debug(`done callback was not provided`)
    }
  }
}

export default BaseGulp
