import BaseRecipe from './baseRecipe'
import { Default as AutoprefixerDefault } from './autoprefixer'
import autoprefixer from 'gulp-autoprefixer'
import BrowserSync from 'browser-sync'
import debug from 'gulp-debug'
import extend from 'extend'
import sass from 'gulp-sass'
import sourcemaps from 'gulp-sourcemaps'
import gulpif from 'gulp-if'

export const Default = {
  debug: true,
  presetType: 'stylesheets',
  task: {
    name: 'sass'
  },
  watch: {
    glob: '**/*.scss',
    options: {
      //cwd: ** resolved from preset **
    }
  },
  source: {
    glob: ['*.scss', '!_*.scss'],
    options: {
      //cwd: ** resolved from preset **
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

const Sass = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default, config))
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
}

export default Sass
