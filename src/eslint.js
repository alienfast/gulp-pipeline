import BaseRecipe from './baseRecipe'
import eslint from 'gulp-eslint'
import extend from 'extend'
//import jscs from 'gulp-jscs'
//import stylish from 'gulp-jscs-stylish'
import debug from 'gulp-debug'
import gulpif from 'gulp-if'
import Util from 'gulp-util'

export const Default = {
  debug: false,
  presetType: 'javascripts',
  task: {
    name: 'eslint'
  },
  source: {
    glob: '**/*.js'
  },
  options: {}
}

const EsLint = class extends BaseRecipe {

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
    return `Lints ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {
    // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(eslint(this.config.options))
      .pipe(eslint.format()) // outputs the lint results to the console. Alternatively use eslint.formatEach() (see Docs).


      //1. HACK solution that works with first error, but is very ugly
      // this should emit the error, but we aren't notified
      .pipe(gulpif(!watching, eslint.failAfterError())) // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.

      // make sure we are notified of any error (this really should be happening in eslint.failAfterError(), but not sure where it is lost)
      .pipe(eslint.result((results) => { // this is single file #result not #results, we don't get notified on #results
        let count = results.errorCount;
        if (count > 0) {
          throw new Util.PluginError(
            'gulp-eslint',
            {
              message: 'Failed with' + (count === 1 ? ' error' : ' errors')
            }
          )
        }
      }))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })

      // 2. Attempt now that returns are in place with the gulpif
      // this should emit the error, but we aren't notified
      //.pipe(gulpif(!watching, eslint.failAfterError())) // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.
      //.on('error', (error) => {
      //  this.notifyError(error, watching)
      //})

      //// 3. Attempt now that returns are in place WITHOUT gulpif
      //// this should emit the error, but we aren't notified
      //.pipe( eslint.failAfterError()) // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.
      //.on('error', (error) => {
      //  this.notifyError(error, watching)
      //})

      // 4. https://github.com/adametry/gulp-eslint/issues/135#issuecomment-180555978
      //.pipe(eslint.results(function (results) {
      //  var count = results.errorCount;
      //  console.log('Total ESLint Error Count: ' + count);
      //  if (count > 0) {
      //    throw new Error('Failed with Errors');
      //  }
      //}))
      //.on('error', function (error) {
      //  console.log('Total ESLint Error Count: ' + error);
      //})
      //.on('finish', function () {
      //  console.log('eslint.results finished');
      //})
      //.on('end', function () {
      //  console.log('eslint.results ended');
      //})

      //// 5. notification is emitted
      //.pipe(eslint.results(function (results) {
      //  var count = results.errorCount;
      //  console.log('*****Error Count: ' + count);
      //  if (count > 0) {
      //    throw new Error('******My custom error');
      //  }
      //}))
      //.on('error', (error) => {
      //  this.notifyError(error, watching)
      //})


      //// 6. notification is emitted
      //.pipe(eslint.results(function (results) {
      //  var count = results.errorCount;
      //  console.log('*****Error Count: ' + count);
      //  if (count > 0) {
      //    throw new PluginError('******My custom error');
      //  }
      //}))
      //.on('error', (error) => {
      //  this.notifyError(error, watching)
      //})

      //// 7. notification is emitted, except when watching
      //.pipe(eslint.results(function (results) {
      //  let count = results.errorCount;
      //  console.error('****************in results handler')
      //  if (count > 0) {
      //    throw new PluginError('gulp-eslint', { message: 'Failed with ' + count + (count === 1 ? ' error' : ' errors') })
      //  }
      //}))
      //.on('error', (error) => {
      //  console.error('****************in error handler')
      //  this.notifyError(error, watching)
      //})


      //.pipe( eslint.failAfterError())
      //.on('error', (error) => {
      //  this.notifyError(error, watching)
      //})



    // FIXME: even including any remnant of JSCS at this point broke everything through the unfound requirement of babel 5.x through babel-jscs.  I can't tell where this occurred, but omitting gulp-jscs for now gets me past this issue.  Revisit this when there are clear updates to use babel 6
    //.pipe(jscs())      // enforce style guide
    //.pipe(stylish())  // log style errors
    //.pipe(jscs.reporter('fail')) // fail on error
  }
}

export default EsLint
