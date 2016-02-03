import BaseRecipe from './baseRecipe'
import extend from 'extend'
import CleanImages from './cleanImages'
import CleanStylesheets from './cleanStylesheets'
import CleanJavascripts from './cleanJavascripts'

const Default = {
  debug: false,
  presetType: 'macro',
  task: {
    name: 'clean'
  }
}

const Clean = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default, config))

    this.cleanImages = new CleanImages(gulp, preset)
    this.cleanStylesheets = new CleanStylesheets(gulp, preset)
    this.cleanJavascripts = new CleanJavascripts(gulp, preset)
  }

  run() {
    this.cleanImages.run()
    this.cleanStylesheets.run()
    this.cleanJavascripts.run()
  }
}

export default Clean
