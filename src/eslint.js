import BaseRecipe from './baseRecipe'
import eslint from 'gulp-eslint'
import extend from 'extend'
import jscs from 'gulp-jscs'
import stylish from 'gulp-jscs-stylish'

const EsLint = (() => {

  const Default = {
    task: 'eslint',
    options: {}
  }

  /**
   * ----------------------------------------------
   * Class Definition
   * ----------------------------------------------
   */
  class EsLint extends BaseRecipe {

    /**
     *
     * @param gulp
     * @param config
     */
    constructor(gulp, config = {}) {
      super(gulp, extend(true, {}, Default, config))
    }

    run() {
      return this.gulp.src(this.config.source)
        // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
        .pipe(eslint(this.config.options))
        // eslint.format() outputs the lint results to the console. Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.
        .pipe(eslint.failAfterError())
        .pipe(jscs())      // enforce style guide
        .pipe(stylish())  // log style errors
        //.pipe(jscs.reporter())
        .pipe(jscs.reporter('fail')) // fail on error
    }

    // ----------------------------------------------
    // protected

    // ----------------------------------------------
    // private

    // ----------------------------------------------
    // static

  }

  return EsLint

})()

export default EsLint
