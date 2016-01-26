import BaseRecipe from './baseRecipe'
import extend from 'extend'
import scssLint from 'gulp-scss-lint'
import scssLintStylish from 'gulp-scss-lint-stylish'

export const Default = {
  debug: true,
  task: {
    name: 'scsslint'
  },
  watch: {
    glob: '**/*.scss',
    options: {
      cwd: 'app/assets/stylesheets'
    }
  },
  source: {
    glob: '**/*.scss',
    options: {
      cwd: 'app/assets/stylesheets'
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
   * @param gulp
   * @param config
   */
  constructor(gulp, config = {}) {
    super(gulp, extend(true, {}, Default, config))
  }

  run() {
    return this.gulp.src(this.config.source.glob, this.config.source.options)
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
