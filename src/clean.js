import BaseRecipe from './baseRecipe'
import extend from 'extend'
import CleanImages from './cleanImages'
import CleanStylesheets from './cleanStylesheets'
import CleanJavascripts from './cleanJavascripts'
import CleanDigest from './cleanDigest'

const Default = {
  debug: false,
  watch: false,
  presetType: 'macro',
  task: {
    name: 'clean',
    help: 'Cleans images, stylesheets, and javascripts.'
  }
}

const Clean = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default, ...configs))

    this.cleanImages = new CleanImages(gulp, preset)
    this.cleanStylesheets = new CleanStylesheets(gulp, preset)
    this.cleanJavascripts = new CleanJavascripts(gulp, preset)
    this.cleanDigest = new CleanDigest(gulp, preset)
  }

  run() {
    this.cleanImages.run()
    this.cleanStylesheets.run()
    this.cleanJavascripts.run()
    this.cleanDigest.run()
  }
}

export default Clean
