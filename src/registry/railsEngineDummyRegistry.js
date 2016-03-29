import RailsRegistry from './railsRegistry'
import Preset from '../preset'
import findup from 'findup-sync'
import extend from 'extend'

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
    const config = extend(true, Default, {preset: Preset.rails()}, ...configs)
    const preset = config.preset

    let extras = {}
    if(config.js === undefined || !config.js.watch){
       extras.js = {
         watch: {
           glob: preset.javascripts.source.all,
           options: { cwd: findup(preset.javascripts.source.options.cwd, {cwd:'..'}) }
         }
       }
    }

    if(config.css === undefined || !config.css.watch) {
      extras.css = {
        watch: {
          glob: preset.stylesheets.source.all,
          options: { cwd: findup(preset.stylesheets.source.options.cwd, {cwd:'..'}) }
        }
      }
    }

    super(Default, extras, config)
  }
}

export default RailsEngineDummyRegistry
