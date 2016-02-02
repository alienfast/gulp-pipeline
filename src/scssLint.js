import BaseRecipe from './baseRecipe'
import extend from 'extend'
import scssLint from 'gulp-scss-lint'
import scssLintStylish from 'gulp-scss-lint-stylish'
import gulpif from 'gulp-if'

export const Default = {
  debug: true,
  platformType: 'stylesheets',
  task: {
    name: 'scsslint'
  },
  watch: {
    glob: '**/*.scss',
    options: {
      //cwd: ** resolved from platform **
    }
  },
  source: {
    glob: '**/*.scss',
    options: {
      //cwd: ** resolved from platform **
    }
  },
  options: {
    customReport: scssLintStylish
  }
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const ScssLint = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param platform - base platform configuration - either one from platform.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, platform, config = {}) {
    super(gulp, platform, extend(true, {}, Default, config))
  }

  run() {
    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(scssLint(this.config.options))

  }

  // ----------------------------------------------
  // protected

  // ----------------------------------------------
  // private

  // ----------------------------------------------
  // static

}

export default ScssLint
