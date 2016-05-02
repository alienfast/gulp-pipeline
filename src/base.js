import extend from 'extend'
import Util from 'gulp-util'
import stringify from 'stringify-object'
import shelljs from 'shelljs'

export const Default = {
  watch: true,
  debug: false,
  cwd: `${shelljs.pwd()}` // ensure a new string - not the string-like object which causes downstream errors on type === string
}

const Base = class {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(...configs) {
    this.config = extend(true, {}, Default, ...configs)
    // this.debugDump(`[${this.constructor.name}] using resolved config`, this.config)
  }

  // ----------------------------------------------
  // protected
  requireValue(value, name) {
    if (value === undefined || value == null) {
      this.notifyError(`${name} must be defined, found: ${value}`)
    }
  }

  log(msg) {
    Util.log(msg)
  }

  debug(msg) {
    if (this.config.debug) {
      this.log(`[${Util.colors.cyan('debug')}][${Util.colors.cyan(this.constructor.name)}] ${msg}`)
    }
  }

  debugDump(msg, obj) {
    if (this.config.debug) {
      this.debug(`${msg}:\n${this.dump(obj)}`)
    }
  }

  dump(obj) {
    return stringify(obj)
  }

  notifyError(error, e) {
    this.log(error)
    throw e
  }

  /**
   * Wraps shellJs calls that act on the file structure to give better output and error handling
   * @param command
   * @param logResult - return output from the execution, defaults to true. If false, will return code instead
   * @param returnCode - defaults to false which will throw Error on error, true will return result code
   */
  exec(command, logResult = true) {
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
      return shellResult
    }
    else {
      this.notifyError(`Command failed \`${command}\`, cwd: ${options.cwd}: ${output}.`)
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

export default Base
