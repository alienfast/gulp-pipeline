import BaseRecipe from './baseRecipe'
import extend from 'extend'

/**
 *  This is the base for publish recipes using BuildControl
 */
export const Default = {

  dir: 'build', // directory to assemble the files - make sure to add this to your .gitignore so you don't publish this to your source branch
  source: {
    types: ['javascripts', 'stylesheets'], // source types to resolve from preset and copy into the build directory pushing to the dist branch
    files: ['.travis.yml', 'package.json', 'bower.json', 'LICENSE*', 'dist'] // any additional file patterns to copy to `dir`
    /*
     # NOTE: we need .travis.yml so that travis-ci will process the ignore branches
     *  add the following:
     *
     *   # remove the dist branch and dist tags from travis builds
     *   branches:
     *    except:
     *       - dist
     *       - /^v(\d+\.)?(\d+\.)?(\*|\d+)$/
     */
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
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default, ...configs)

    // use the dir as the cwd to the BuildControl class
    this.config.options = extend(true, {debug: this.config.debug, cwd: this.config.dir}, this.config.options)
  }
}

export default BasePublish
