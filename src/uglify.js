import BaseRecipe from './baseRecipe'
import uglify from 'gulp-uglify'
import debug from 'gulp-debug'
import gulpif from 'gulp-if'
import sourcemaps from 'gulp-sourcemaps'
import concat from 'gulp-concat'
import extReplace from 'gulp-ext-replace'
import glob from 'glob'

export const Default = {
  debug: false,
  presetType: 'postProcessor',
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
  },

  concat: {
    dest: undefined // if specified, will use concat to this dest filename, OTHERWISE, it will just assume one file and rename to .min.js
  }
}

/**
 * By default, assumes ONE source glob file match, OTHERWISE specify {concat: { dest: 'out.min.js' } }
 *
 */
const Uglify = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default, ...configs)
  }

  createDescription() {
    let msg = `Uglifies ${this.config.source.options.cwd}/${this.config.source.glob} to ${this.config.dest}`
    if (this.config.concat.dest) {
      msg += `/${this.config.concat.dest}`
    }
    return msg
  }

  run(done, watching = false) {

    // helpful log message if files not found
    let files = glob.sync(this.config.source.glob, this.config.source.options)
    if (!files || files.length <= 0) {
      this.log(`No sources found to uglify in: ${this.dump(this.config.source)}`)
    }

    if (this.config.concat.dest) {

      // run the concat scenario
      this.debug(`concat dest: ${this.config.dest}/${this.config.concat.dest}`)
      return this.gulp.src(this.config.source.glob, this.config.source.options)
        .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
        .pipe(concat(this.config.concat.dest))

        // identical to below
        .pipe(sourcemaps.init())
        .pipe(uglify(this.config.options))
        .on('error', (error) => {
          this.notifyError(error, done, watching)
        })
        .pipe(this.gulp.dest(this.config.dest))
    }
    else {

      // run the single file scenario
      this.debug('single file with no dest')

      if (files.length > 1) {
        throw new Error(`Should only find one file but found ${files.length} for source: ${this.dump(this.config.source)}.  Use the concat: {dest: 'output.min.js' } configuration for multiple files concatenated with uglify.  Files found: ${this.dump(files)}`)
      }

      return this.gulp.src(this.config.source.glob, this.config.source.options)
        .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
        .pipe(extReplace('.min.js', /.js$/))  // needs to be end-of-line regex so we don't messup paths with '.js' in the names.

        // identical to above
        .pipe(sourcemaps.init())
        .pipe(uglify(this.config.options))
        .on('error', (error) => {
          this.notifyError(error, done, watching)
        })
        .pipe(this.gulp.dest(this.config.dest))
    }
  }
}

export default Uglify
