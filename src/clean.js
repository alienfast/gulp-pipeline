import Aggregate from './aggregate'
import Preset from './preset'
import CleanImages from './cleanImages'
import CleanStylesheets from './cleanStylesheets'
import CleanJavascripts from './cleanJavascripts'
import CleanDigest from './cleanDigest'
import parallel from './util/parallel'

const Default = {
  debug: false,
  watch: false,
  presetType: 'macro',
  task: {
    name: 'clean',
    description: 'Cleans images, stylesheets, and javascripts.'
  }
}

const Clean = class extends Aggregate {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, ...configs) {
    let config = Preset.resolveConfig(preset, Default, ...configs)
    let recipes = parallel(gulp,
      new CleanImages(gulp, preset, ...configs),
      new CleanStylesheets(gulp, preset, ...configs),
      new CleanJavascripts(gulp, preset, ...configs),
      new CleanDigest(gulp, preset, ...configs)
    )

    super(gulp, config.task.name, recipes, config)
  }
}

export default Clean
