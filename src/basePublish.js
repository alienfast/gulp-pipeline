import BaseRecipe from './baseRecipe'
import extend from 'extend'
import path from 'path'


/**
 *  This is the base for publish recipes using BuildControl
 */
export const Default = {

  dir: 'build', // directory to assemble the files - make sure to add this to your .gitignore so you don't publish this to your source branch
  source: {
    types: ['javascripts', 'stylesheets'], // source types to resolve from preset and copy into the build directory pushing to the dist branch
    files: ['package.json', 'bower.json', 'LICENSE*', 'dist'] // any additional file patterns to copy to `dir`
  },
  watch: false,
  presetType: 'macro',
  options: { // see https://github.com/alienfast/build-control/blob/master/src/buildControl.js#L11
    //cwd: 'build', // Uses recipe's dir
    branch: 'dist',
    tag: {
      existsFailure: false
    },
    clean: {
      before: true,
      after: false
    }
  }
}

const BasePublish = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default, config))

    // use the dir as the cwd to the BuildControl class
    this.config.options = extend(true, {debug: this.config.debug, cwd: this.config.dir}, this.config.options)
  }
}

export default BasePublish
