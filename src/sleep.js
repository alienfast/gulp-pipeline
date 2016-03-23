import BaseRecipe from './baseRecipe'

const Default = {
  debug: false,
  watch: false,
  presetType: 'macro',
  task: false
}

/**
 * Sleep the given ms value, for those quirky cases like when you need the filesystem to catch up.
 */
const Sleep = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, sleep, ...configs) {
    super(gulp, preset, Default, {sleep: sleep}, ...configs)
  }

  createDescription(){
    return `Sleeps for ${this.config.sleep} milliseconds.`
  }

  run(done) {
    setTimeout(() => { // eslint-disable-line no-undef
      this.donezo(done)
    }, this.config.sleep)
  }
}

export default Sleep
