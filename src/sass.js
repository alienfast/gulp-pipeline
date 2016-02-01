import BaseRecipe from './baseRecipe'
import { Default as AutoprefixerDefault } from './autoprefixer'
import autoprefixer from 'gulp-autoprefixer'
import BrowserSync from 'browser-sync'
import debug from 'gulp-debug'
import extend from 'extend'
import sass from 'gulp-sass'
import sourcemaps from 'gulp-sourcemaps'
import Util from 'gulp-util'


// TODO: scsslint

export const Default = {
  debug: true,
  task: {
    name: 'sass'
  },
  watch: {
    glob: '**/*.scss',
    options: {
      cwd: 'app/assets/stylesheets'
    }
  },
  source: {
    glob: ['*.scss', '!_*.scss'],
    options: {
      cwd: 'app/assets/stylesheets'
    }
  },
  dest: 'public/stylesheets',
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
  constructor(gulp, config = {}) {
    super(gulp, extend(true, {}, Default, config))
    this.browserSync = BrowserSync.create()
  }

  run() {
    let bundle = this.gulp.src(this.config.source.glob, this.config.source.options)

    if (this.config.debug) {
      bundle.pipe(debug())
    }

    bundle
      .pipe(sourcemaps.init())
      .pipe(sass(this.config.options))
      .on('error', (error) => {
        this.notifyError(error)
      })
      .pipe(autoprefixer(this.config.autoprefixer.options))
      .pipe(sourcemaps.write())
      .pipe(this.gulp.dest(this.config.dest))
      .pipe(this.browserSync.stream())

    return bundle
  }

  // ----------------------------------------------
  // protected

  // ----------------------------------------------
  // private

  // ----------------------------------------------
  // static

}

export default Sass
