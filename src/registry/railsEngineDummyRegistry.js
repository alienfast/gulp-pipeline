import RailsRegistry from './railsRegistry'
import EsLint from '../eslint'
import ScssLint from '../scssLint'
import parallel from '../util/parallel'
import findup from 'findup-sync'

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

    // this method just added a watch path to the aggregates, but failed to re-lint the engine sources
    //const config = extend(true, Default, {preset: Preset.rails()}, ...configs)
    //const preset = config.preset
    //
    //let extras = {}
    //if (config.js === undefined || !config.js.watch) {
    //  extras.js = {
    //    watch: {
    //      glob: preset.javascripts.source.all,
    //      options: {cwd: findup(preset.javascripts.source.options.cwd, {cwd: '..'})}
    //    }
    //  }
    //}
    //
    //if (config.css === undefined || !config.css.watch) {
    //  extras.css = {
    //    watch: {
    //      glob: preset.stylesheets.source.all,
    //      options: {cwd: findup(preset.stylesheets.source.options.cwd, {cwd: '..'})}
    //    }
    //  }
    //}
    //
    //super(Default, extras, config)
    super(Default, ...configs)
  }

  /**
   * Add linter for engine source
   * @param gulp
   */
  esLinters(gulp) {
    const engineCwd = {
      options: {
        cwd: findup(this.config.preset.javascripts.source.options.cwd, {cwd: '..'})
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
        cwd: findup(this.config.preset.stylesheets.source.options.cwd, {cwd: '..'})
      }
    }

    return parallel(gulp,
      super.scssLinters(gulp),
      new ScssLint(gulp, this.config.preset, {
        task: {name: 'scss:lint:engine'},
        source: engineCwd,
        watch: engineCwd
      }) // lint the engine source
    )
  }
}

export default RailsEngineDummyRegistry
