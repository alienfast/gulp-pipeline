import RailsRegistry from './railsRegistry'
import EsLint from '../eslint'
import ScssLint from '../scssLint'
import parallel from '../util/parallel'
import File from '../util/file'

export const Default = {}

/**
 * Simplified registry for RailsEngineDummy applications
 *  - adds extra watches on engine js/css sources
 *
 * gulp.registry(new RailsEngineDummyRegistry(...configs))
 */
const RailsEngineDummyRegistry = class extends RailsRegistry {

  /**
   * @param config - customized overrides of the Default, last one wins
   */
  constructor(...configs) {
    super(Default, ...configs)
  }

  /**
   * Add linter for engine source
   * @param gulp
   */
  esLinters(gulp) {
    const engineCwd = {
      options: {
        cwd: File.findup(this.config.preset.javascripts.source.options.cwd, {cwd: '..'})
      }
    }

    return parallel(gulp,
      super.esLinters(gulp),
      new EsLint(gulp, this.config.preset, {
        task: {name: 'eslint:engine'},
        source: engineCwd,
        watch: engineCwd
      }) // lint the engine source
    )
  }

  /**
   * Add linter for engine source
   * @param gulp
   */
  scssLinters(gulp) {
    const engineCwd = {
      options: {
        cwd: File.findup(this.config.preset.stylesheets.source.options.cwd, {cwd: '..'})
      }
    }

    return parallel(gulp,
      super.scssLinters(gulp),
      new ScssLint(gulp, this.config.preset, {
        //debug: true,
        task: {name: 'scss:lint:engine'},
        source: engineCwd,
        watch: engineCwd
      }) // lint the engine source
    )
  }
}

export default RailsEngineDummyRegistry
