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

  /**
   * Class-based configuration overrides:
   *  - these may be a single config hash or array of config hashes (last hash overrides earlier hashes)
   *  - in some cases, passing false for the class name may be implemented as omitting the registration of the recipe (see implementation of #init for details)
   *
   *  @return -  array - one or more configs as an array, so usage below in init is a universal spread/splat
   */
  classConfig(clazz) {

    const className = clazz.prototype.constructor.name
    this.debug(`Resolving config for class: ${className}...`)
    let config = this.config[className]

    this.debugDump(`config`, config)
    if (config === undefined) {
      config = [{}]
    }

    if (!Array.isArray(config)) {
      config = [config]
    }

    // add global at the begining of the array
    config.unshift(this.config.global)

    return config
  }

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
