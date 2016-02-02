import BaseRecipe from './baseRecipe'
import { Default as AutoprefixerDefault } from './autoprefixer'
import autoprefixer from 'gulp-autoprefixer'
import BrowserSync from 'browser-sync'
import debug from 'gulp-debug'
import extend from 'extend'
import sass from 'gulp-sass'
import sourcemaps from 'gulp-sourcemaps'
import Util from 'gulp-util'
import gulpif from 'gulp-if'

export const Default = {
  debug: true,
  platformType: 'stylesheets',
  task: {
    name: 'sass'
  },
  watch: {
    glob: '**/*.scss',
    options: {
      //cwd: ** resolved from platform **
    }
  },
  source: {
    glob: ['*.scss', '!_*.scss'],
    options: {
      //cwd: ** resolved from platform **
    }
  },
  options: {
    indentedSyntax: true,
    errLogToConsole: false,
    includePaths: ['node_modules']
  },
  // capture defaults from autoprefixer class
  autoprefixer: {
    options: AutoprefixerDefault.options
  }
}


/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const Sass = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param platform - base platform configuration - either one from platform.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, platform, config = {}) {
    super(gulp, platform, extend(true, {}, Default, config))
    this.browserSync = BrowserSync.create()
  }

  run(watching = false) {
    return this.gulp.src(this.config.source.glob, this.config.source.options)

      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(sourcemaps.init())
      .pipe(sass(this.config.options))
      .on('error', (error) => {
        this.notifyError(error, watching)
      })
      .pipe(autoprefixer(this.config.autoprefixer.options))
      .pipe(sourcemaps.write())
      .pipe(this.gulp.dest(this.config.dest))
      .pipe(this.browserSync.stream())
  }

  // ----------------------------------------------
  // protected

  // ----------------------------------------------
  // private

  // ----------------------------------------------
  // static

}

export default Sass
