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
    glob: './app/assets/stylesheets/**/*.scss'
  },
  source: './app/assets/stylesheets/**/*.scss',
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
    return this.gulp.src(this.config.source)
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
