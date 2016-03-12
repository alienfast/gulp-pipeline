import Base from './base'
import notify from 'gulp-notify'
import Util from 'gulp-util'
import shelljs from 'shelljs'

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
    this.gulp = gulp
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

  notifyError(error, done, watching = false) {

    //this.debugDump('notifyError', error)

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
      // if this is not used, we see "Did you forget to signal async completion?", it also unfortunately logs more distracting information below.  But we need to exec the callback with an error to halt execution.
      this.donezo(done, error)
    }
    else {
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

  /**
   * Wraps shellJs calls that act on the file structure to give better output and error handling
   * @param command
   * @param logResult - return output from the execution, defaults to true. If false, will return code instead
   * @param returnCode - defaults to false which will throw Error on error, true will return result code
   */
  exec(command, logResult = true, returnCode = false) {
    let options = {silent: true}
    if (this.config.cwd) {
      options['cwd'] = this.config.cwd
    }
    else {
      this.notifyError('cwd is required')
    }

    if (command.includes(`undefined`)) {
      this.notifyError(`Invalid command: ${command}`)
    }

    this.debug(`Executing \`${command}\` with cwd: ${options['cwd']}`)
    let shellResult = shelljs.exec(command, options)
    let output = this.logShellOutput(shellResult, logResult);

    if (shellResult.code === 0 || shellResult.code === 1) {

      // ---
      // determine the return value
      if (returnCode) {
        return shellResult.code
      }
      else {
        return output
      }
    }
    else {
      if (returnCode) {
        return shellResult.code
      }
      else {
        this.notifyError(`Command failed \`${command}\`, cwd: ${options.cwd}: ${shellResult.stderr}.`)
      }
    }
  }

  logShellOutput(shellResult, logResult) {
    //this.debug(`[exit code] ${shellResult.code}`)

    // ---
    // Log the result
    // strangely enough, sometimes useful messages from git are an stderr even when it is a successful command with a 0 result code
    let output = shellResult.stdout
    if (output == '') {
      output = shellResult.stderr
    }

    //this.log(stringify(shellResult))
    if (output != '') {
      if (logResult) {
        this.log(output)
      }
      else {
        this.debug(`[output] \n${output}`)
      }
    }
    return output;
  }
}

export default BaseGulp
