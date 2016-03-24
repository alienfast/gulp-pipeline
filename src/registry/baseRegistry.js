import extend from 'extend'
import Util from 'gulp-util'
import stringify from 'stringify-object'
import DefaultRegistry from 'undertaker-registry'

export const Default = {
  debug: false
}

const BaseRegistry = class extends DefaultRegistry {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(...configs) {
    super()
    this.config = extend(true, {}, Default, ...configs)
    this.debugDump(`[${this.constructor.name}] using resolved config:`, this.config)
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
    this.debug(`${msg}:\n${this.dump(obj)}`)
  }

  dump(obj) {
    return stringify(obj)
  }

  notifyError(error, e) {
    this.log(error)
    throw e
  }
}

export default BaseRegistry
