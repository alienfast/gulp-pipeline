import BaseRecipe from './baseRecipe'
import extend from 'extend'
import scssLint from 'gulp-scss-lint'
import scssLintStylish from 'gulp-scss-lint-stylish'
import debug from 'gulp-debug'
import gulpif from 'gulp-if'

export const Default = {
  debug: false,
  presetType: 'stylesheets',
  task: {
    name: 'scsslint'
  },
  watch: {
    //glob: ** resolved from preset **
    options: {
      //cwd: ** resolved from preset **
    }
  },
  source: {
    glob: '**/*.scss',
    options: {
      //cwd: ** resolved from preset **
    }
  },
  options: {
    customReport: scssLintStylish
  }
}

const ScssLint = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default, config))
  }

  createHelpText(){
    return `Lints ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(watching = false) {
    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(scssLint(this.config.options))
      .on('error', (error) => {
        this.notifyError(error, watching)
      })
  }
}

export default ScssLint
