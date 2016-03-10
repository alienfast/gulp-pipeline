import BaseRecipe from './baseRecipe'
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
    description: 'Cleans images, stylesheets, and javascripts.'
  }
}

const Clean = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default, ...configs)

    this.cleanImages = new CleanImages(gulp, preset, ...configs)
    this.cleanStylesheets = new CleanStylesheets(gulp, preset, ...configs)
    this.cleanJavascripts = new CleanJavascripts(gulp, preset, ...configs)
    this.cleanDigest = new CleanDigest(gulp, preset, ...configs)
  }

  run() {
    this.cleanImages.run()
    this.cleanStylesheets.run()
    this.cleanJavascripts.run()
    this.cleanDigest.run()
  }
}

export default Clean
