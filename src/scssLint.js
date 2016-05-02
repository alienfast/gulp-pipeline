import BaseRecipe from './baseRecipe'
import scssLint from 'gulp-scss-lint'
import scssLintStylish from 'gulp-scss-lint-stylish'
import debug from 'gulp-debug'
import gulpif from 'gulp-if'
import File from './util/file'

export const Default = {
  debug: false,
  presetType: 'stylesheets',
  task: {
    name: 'scss:lint'
  },
  source: {
    glob: '**/*.scss'
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
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default, ...configs)

    if (!this.config.source.options.cwd) {
      this.notifyError(`Expected to find source.options.cwd in \n${this.dump(this.config)}`)
    }

    // If a config is not specified, emulate the eslint config behavior by looking up.
    //  If there is a config at or above the source cwd, use it, otherwise leave null.
    if (!this.config.options.config) {
      let configFile = File.findup('.scss-lint.yml', {cwd: this.config.source.options.cwd})
      if (configFile) {
        this.config.options.config = configFile
      }
    }
  }

  createDescription() {
    return `Lints ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {
    if (this.config.options.config) {
      this.log(`Using config: ${this.config.options.config}`)
    }

    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(scssLint(this.config.options))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })
  }
}

export default ScssLint
