import BaseRecipe from './baseRecipe'
import eslint from 'gulp-eslint'
import extend from 'extend'
//import jscs from 'gulp-jscs'
//import stylish from 'gulp-jscs-stylish'
import debug from 'gulp-debug'
import gulpif from 'gulp-if'
import Util from 'gulp-util'

let PluginError = Util.PluginError

export const Default = {
  debug: false,
  presetType: 'javascripts',
  task: {
    name: 'eslint'
  },
  watch: {
    glob: '**/*.js',
    options: {
      //cwd: ** resolved from preset **
    }
  },
  source: {
    glob: '**/*.js',
    options: {
      //cwd: ** resolved from preset **
    }
  },
  options: {}
}

const EsLint = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default, config))
  }

  run(watching = false) {
    // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
    let bundle = this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(eslint(this.config.options))
      .pipe(eslint.format()) // outputs the lint results to the console. Alternatively use eslint.formatEach() (see Docs).

      // this should throw the error, but we aren't notified
      .pipe(gulpif(!watching, eslint.failAfterError())) // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.

      // make sure we are notified of any error (this really should be happening in eslint.failAfterError(), but not sure where it is lost)
      .pipe(eslint.result((results) => {
        let count = results.errorCount;
        if (count > 0) {
          throw new PluginError(
            'gulp-eslint',
            {
              name: 'ESLintError',
              message: 'Failed with ' + count + (count === 1 ? ' error' : ' errors')
            }
          )
        }
      }))
      .on('error', (error) => {
        this.notifyError(error, watching)
      })


    // FIXME: even including any remnant of JSCS at this point broke everything through the unfound requirement of babel 5.x through babel-jscs.  I can't tell where this occurred, but omitting gulp-jscs for now gets me past this issue.  Revisit this when there are clear updates to use babel 6
    //.pipe(jscs())      // enforce style guide
    //.pipe(stylish())  // log style errors
    //.pipe(jscs.reporter('fail')) // fail on error

    return bundle
  }
}

export default EsLint
