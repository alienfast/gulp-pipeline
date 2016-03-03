import extend from 'extend'
import Util from 'gulp-util'
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
  constructor(...configs) {
    this.config = extend(true, {}, Default, ...configs)
    this.debug(`[${this.constructor.name}] using resolved config: ${stringify(this.config)}`)
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
    this.debug(`${msg}:\n${stringify(obj)}`)
  }

  notifyError(error, e) {
    this.log(error)
    throw e
  }

  debugOptions() {
    return {title: `[${Util.colors.cyan('debug')}][${Util.colors.cyan(this.taskName())}]`}
  }
}

export default Base
