import BaseRecipe from './baseRecipe'
import eslint from 'gulp-eslint'
import debug from 'gulp-debug'
import gulpif from 'gulp-if'
import {PluginError} from 'gulp-util'


export const Default = {
  debug: false,
  presetType: 'javascripts',
  task: {
    name: 'eslint'
  },
  source: {
    glob: '**/*.js'
  },
  options: {
    // Files were being ignored
    // ---------------------------
    //  With gulp-pipeline setup, we are specific enough with cwd that we don't need to use a blanket
    //  (default) .eslintignore file.  Turn off this behavior and lint anything we point at.
    //  @see http://eslint.org/docs/developer-guide/nodejs-api#cliengine
    warnFileIgnored: true,
    ignore: false
  }
}

const EsLint = class extends BaseRecipe {

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
    return `Lints ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {
    // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(eslint(this.config.options))
      .pipe(eslint.format()) // outputs the lint results to the console. Alternatively use eslint.formatEach() (see Docs).
      // primarily eslint.failAfterError() but we use notifyError to process the difference between watching and not so we don't end process.
      .pipe(eslint.results((results) => {
        let count = results.errorCount;
        if (count > 0) {
          let error =  new PluginError(
            'gulp-eslint',
            {
              name: 'ESLintError',
              message: 'Failed with ' + count + (count === 1 ? ' error' : ' errors')
            }
          )

          this.notifyError(error, done, watching)
        }
      }))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })

    // FIXME: even including any remnant of JSCS at this point broke everything through the unfound requirement of babel 5.x through babel-jscs.  I can't tell where this occurred, but omitting gulp-jscs for now gets me past this issue.  Revisit this when there are clear updates to use babel 6
    //.pipe(jscs())      // enforce style guide
    //.pipe(stylish())  // log style errors
    //.pipe(jscs.reporter('fail')) // fail on error
  }
}

export default EsLint
