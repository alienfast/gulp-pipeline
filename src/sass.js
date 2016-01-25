import BaseRecipe from './baseRecipe'
import { Autoprefixer, Default as AutoprefixerDefault } from './autoprefixer'
import autoprefixer from 'gulp-autoprefixer'
import extend from 'extend'
import sass from 'gulp-sass'
import sourcemaps from 'gulp-sourcemaps'
import BrowserSync from 'browser-sync'
import Util from 'gulp-util'
import debug from 'gulp-debug'

// TODO: scsslint

export const Default = {
  debug: true,
  task: {
    name: 'sass'
  },
  watch: {
    glob: './app/assets/stylesheets/**/*.scss'
  },
  source: './app/assets/stylesheets/application.scss',
  dest: 'public/stylesheets',
  options: {
    indentedSyntax: true,
    errLogToConsole: true,
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
   * @param gulp
   * @param config
   */
  constructor(gulp, config = {}) {
    super(gulp, extend(true, {}, Default, config))
    this.browserSync = BrowserSync.create()
  }

  run() {
    let bundle = this.gulp.src(this.config.source)

    if (this.config.debug) {
      bundle.pipe(debug())
    }

    bundle.pipe(sourcemaps.init())
      .pipe(sass(this.config.options))
      .pipe(sourcemaps.write())
      .pipe(autoprefixer(this.config.autoprefixer.options))
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
