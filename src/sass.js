import BaseRecipe from './baseRecipe'
import { Default as AutoprefixerDefault } from './autoprefixer'
import autoprefixer from 'gulp-autoprefixer'
import BrowserSync from 'browser-sync'
import debug from 'gulp-debug'
import extend from 'extend'
import sass from 'gulp-sass'
import sourcemaps from 'gulp-sourcemaps'
import gulpif from 'gulp-if'

import findup from 'findup-sync'
const node_modules = findup('node_modules')

export const Default = {
  debug: false,
  presetType: 'stylesheets',
  task: {
    name: 'sass'
  },
  options: {
    // WARNING: `includePaths` this should be a fully qualified path if overriding
    //  @see https://github.com/sass/node-sass/issues/1377
    includePaths: [node_modules] // this will find any node_modules above the current working directory
  },
  // capture defaults from autoprefixer class
  autoprefixer: {
    options: AutoprefixerDefault.options
  }
}

const Sass = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default, ...configs))
    this.browserSync = BrowserSync.create()
  }

  createDescription() {
    return `Compiles ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {
    // add debug for importing problems (can be very helpful)
    if(this.config.debug && this.config.options.importer === undefined) {
      this.config.options.importer = (url, prev, done) => {
        this.debug(`importing ${url} from ${prev}`)
        done({file: url})
      }
    }

    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(sourcemaps.init())
      .pipe(sass(this.config.options))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })
      .pipe(autoprefixer(this.config.autoprefixer.options))
      .pipe(sourcemaps.write())
      .pipe(this.gulp.dest(this.config.dest))
      .pipe(this.browserSync.stream())
  }
}

export default Sass
