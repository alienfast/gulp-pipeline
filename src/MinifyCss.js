import BaseRecipe from './baseRecipe'
import BrowserSync from 'browser-sync'
import debug from 'gulp-debug'
import extend from 'extend'
import gulpif from 'gulp-if'
import cssnano from 'gulp-cssnano'

export const Default = {
  debug: true,
  presetType: 'digest',
  task: {
    name: 'minifyCss'
  },
  watch: {
    glob: ['digest/**.css'],
    options: {
      //cwd: ** resolved from preset **
    }
  },
  source: {
    glob: ['digest/**.css'],
    options: {
      //cwd: ** resolved from preset **
    }
  },
  options: {}
}

/**
 * Recipe to be run after Rev or any other that places final assets in the digest destination directory
 */
const MinifyCss = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default, config))
    this.browserSync = BrowserSync.create()
  }

  createHelpText() {
    return `Minifies digest css from ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(watching = false) {

    // FIXME merge in the clean as a task


    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(cssnano(this.config.options))
      .pipe(this.gulp.dest(this.config.dest))
      .on('error', (error) => {
        this.notifyError(error, watching)
      })
      .pipe(this.browserSync.stream())

  }
}

export default MinifyCss
