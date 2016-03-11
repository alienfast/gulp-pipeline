import BaseRecipe from './baseRecipe'
import uglify from 'gulp-uglify'
import extend from 'extend'
import debug from 'gulp-debug'
import gulpif from 'gulp-if'
import sourcemaps from 'gulp-sourcemaps'
import concat from 'gulp-concat'

export const Default = {
  debug: false,
  presetType: 'javascripts',
  task: {
    name: 'uglify'
  },
  source: {
    glob: '**/*.js'
  },
  options: {
    compress: {
      warnings: true
    },
    mangle: false,
    preserveComments: /^!|@preserve|@license|@cc_on/i
  }
}

const Uglify = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default, ...configs))
  }

  createDescription(){
    return `Uglifies ${this.config.source.options.cwd}/${this.config.source.glob} to ${this.config.dest}/${this.config.options.dest}`
  }

  run(done, watching = false) {
    // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
    let bundle = this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(sourcemaps.init())
      .pipe(concat(this.config.options.dest))
      .pipe(uglify(this.config.options))
      .on('error', (error) => {
        this.notifyError(error, watching)
      })
      .pipe(this.gulp.dest(this.config.dest))

    return bundle
  }
}

export default Uglify
