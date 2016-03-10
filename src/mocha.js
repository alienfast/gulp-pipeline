import BaseRecipe from './baseRecipe'
import Preset from './preset'
import extend from 'extend'
import mocha from 'gulp-mocha'
import debug from 'gulp-debug'
import gulpif from 'gulp-if'

export const Default = {
  debug: false,
  presetType: 'javascripts',
  task: {
    name: 'mocha'
  },
  options: {}
}

const Mocha = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    // resolve watch cwd based on test cwd
    super(gulp, preset, extend(true, {},
      Default,
      {watch: {options: {cwd: Preset.resolveConfig(preset, Default, ...configs).test.options.cwd}}},
      ...configs))
  }

  createDescription() {
    return `Tests ${this.config.test.options.cwd}/${this.config.test.glob}`
  }

  run(watching = false) {
    let bundle = this.gulp.src(this.config.test.glob, this.config.test.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(mocha({reporter: 'nyan'})) // gulp-mocha needs filepaths so you can't have any plugins before it
      .on('error', (error) => {
        this.notifyError(error, watching)
      })

    return bundle
  }
}

export default Mocha
