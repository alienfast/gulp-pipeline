import BaseRecipe from './baseRecipe'
import { rollup } from 'rollup'
//import BrowserSync from 'browser-sync'
import extend from 'extend'
import glob from 'glob'
import stringify from 'stringify-object'

export const Default = {
  debug: true,
  platformType: 'javascripts',
  task: {
    name: 'rollup:es'
  },

  watch: {
    glob: '**/*.js',
    options: {
      //cwd: ** resolved from platform **
    }
  },
  source: {
    glob: 'index.js',
    options: {
      //cwd: ** resolved from platform **
    }
  },

  //dest: './public/assets',
  options: {
    //entry: 'src/index.js', // is created from the source glob/cwd
    //dest: '', // required
    sourceMap: true,
    format: 'es6'
    //plugins: [],
  }
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const RollupEs = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param platform - base platform configuration - either one from platform.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, platform, config = {}) {
    super(gulp, platform, extend(true, {}, Default, config))
    //this.browserSync = BrowserSync.create()
  }

  resolveEntry() {
    // Resolve the source and make sure there is one entry point
    if (Array.isArray(this.config.source.glob)) {
      throw new Error(`Rollup only accepts one entry point.  Found array for source.glob: ${this.config.source.glob}`)
    }
    // get full path results
    this.config.source.options['realpath'] = true

    let entry = glob.sync(this.config.source.glob, this.config.source.options)

    if (!entry || entry.length <= 0) {
      throw new Error(`Unable to resolveEntry() for source: ${stringify(this.config.source)}`)
    }

    if (entry.length > 1) {
      throw new Error(`resolveEntry() should only find one entry point but found ${entry} for source: ${stringify(this.config.source)}`)
    }
    return entry[0]
  }

  run() {
    let options = extend(true, {
        entry: this.resolveEntry(),
        //onwarn: (message) => this.onwarn(message)
        onwarn: (message) => {
          console.error(message)
        }
      },
      this.config.options)

    if (!options.dest) {
      throw new Error(`dest must be specified.`)
    }

    this.debug(`Executing rollup with options: ${stringify(options)}`)

    return rollup(options)
      .then((bundle) => {
        return bundle.write(options)
      })
      .catch((error) => {
        error.plugin = 'rollup'
        this.notifyError(error)
      })
  }


  // ----------------------------------------------
  // protected

  // ----------------------------------------------
  // private

  // ----------------------------------------------
  // static

}

export default RollupEs
