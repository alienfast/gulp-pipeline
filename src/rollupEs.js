import BaseRecipe from './baseRecipe'
import {rollup} from 'rollup'
import extend from 'extend'
import glob from 'glob'
import replace from 'rollup-plugin-replace'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import process from 'process'
import File from './util/file'
//import BrowserSync from 'browser-sync'
const node_modules = File.findup('node_modules')


export const Default = {
  debug: false,
  presetType: 'javascripts',
  task: {
    name: 'rollup:es'
  },
  options: {
    //entry: 'src/index.js', // ** resolved from the source glob/cwd **
    //dest: '', // ** resolved from preset **
    sourceMap: true,
    format: 'es6',
    plugins: []
  }
}

export const NodeEnvReplace = {
  nodeEnvReplace: {
    enabled: false,
    options: {
      'process.env.NODE_ENV': JSON.stringify('production')
    }
  }
}

// This nodeResolve configuration is not used unless it is within the plugins: [nodeResolve(this.config.nodeResolve.options)] - pass this.config.nodeResolve.enabled == true in config to enable default options
export const NodeResolve = {
  nodeResolve: {
    enabled: false,

    // - see https://github.com/rollup/rollup-plugin-node-resolve
    options: {
      // use "jsnext:main" if possible
      // – see https://github.com/rollup/rollup/wiki/jsnext:main
      jsnext: true,

      // use "main" field or index.js, even if it's not an ES6 module (needs to be converted from CommonJS to ES6
      // – see https://github.com/rollup/rollup-plugin-commonjs
      main: true,

      //skip: [ 'some-big-dependency' ], // if there's something your bundle requires that you DON'T want to include, add it to 'skip'

      // By default, built-in modules such as `fs` and `path` are treated as external if a local module with the same name
      // can't be found. If you really want to turn off this behaviour for some reason, use `builtins: false`
      builtins: false,

      // Some package.json files have a `browser` field which specifies alternative files to load for people bundling
      // for the browser. If that's you, use this option, otherwise pkg.browser will be ignored.
      browser: true,

      // not all files you want to resolve are .js files
      extensions: ['.js', '.json']
    }
  }
}

export const CommonJs = {
  commonjs: {
    enabled: false,
    options: {
      include: `${node_modules}/**`,
      //exclude: [ `${node_modules}/foo/**', `${node_modules}/bar/**` ],

      // search for files other than .js files (must already be transpiled by a previous plugin!)
      extensions: ['.js'] // defaults to [ '.js' ]
    }
  }
}

const RollupEs = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    let config = extend(true, {}, ...configs)

    if (!config.options.dest) {
      throw new Error(`options.dest filename must be specified.`)
    }

    super(gulp, preset, Default, NodeEnvReplace, NodeResolve, CommonJs, config)

    // Utilize the presets to get the dest cwd/base directory, then add the remaining passed-in file path/name
    this.config.options.dest = `${this.config.dest}/${this.config.options.dest}`

    //----------------------------------------------
    // plugins order: nodeResolve, commonjs, babel

    // Add commonjs before babel
    if (this.config.commonjs.enabled) {
      this.debug('Adding commonjs plugin')
      // add at the beginning
      this.config.options.plugins.unshift(commonjs(this.config.commonjs.options))
    }

    // Add nodeResolve before (commonjs &&|| babel)
    if (this.config.nodeResolve.enabled) {
      this.debug('Adding nodeResolve plugin')
      // add at the beginning
      this.config.options.plugins.unshift(nodeResolve(this.config.nodeResolve.options))
    }

    // Add nodeEnvReplace before (nodeResolve &&|| commonjs &&|| babel)
    if (this.config.nodeEnvReplace.enabled) {
      this.debug('Adding nodeEnvReplace plugin')
      // add at the beginning
      this.config.options.plugins.unshift(replace(this.config.nodeEnvReplace.options))
    }

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
      throw new Error(`Unable to resolveEntry() for source: ${this.dump(this.config.source)} from ${process.cwd()}`)
    }

    if (entry.length > 1) {
      throw new Error(`resolveEntry() should only find one entry point but found ${entry} for source: ${this.dump(this.config.source)}`)
    }
    return entry[0]
  }

  createDescription() {
    return `Rollup ${this.config.source.options.cwd}/${this.config.source.glob} in the ${this.config.options.format} format to ${this.config.options.dest}`
  }

  run(done, watching = false) {
    this.debug(`watching? ${watching}`)
    let options = extend(true, {
        entry: this.resolveEntry(),
        onwarn: (message) => {
          //this.notifyError(message, watching)
          this.log(message)
        }
      },
      this.config.options)

    this.logDebugOptions(options)

    return rollup(options)
      .then((bundle) => {
        return bundle.write(options)
      })
      .catch((error) => {
        error.plugin = 'rollup'
        this.notifyError(error, done, watching)
      })
  }

  /**
   * This is rather elaborate, but useful.  It strings together the options used to run rollup for debugging purposes.
   *
   * @param options
   */
  logDebugOptions(options) {
    if (!this.config.debug) {
      return
    }

    let prunedOptions = extend(true, {}, options)
    prunedOptions.plugins = 'x' // placeholder to replace

    let plugins = `plugins: [ // (count: ${this.config.options.plugins.length})\n`
    if (this.config.commonjs.enabled) {
      plugins += `\t\tcommonjs(${this.dump(this.config.commonjs.options)}),\n`
    }
    if (this.config.nodeResolve.enabled) {
      plugins += `\t\tnodeResolve(${this.dump(this.config.nodeResolve.options)}),\n`
    }
    if (this.config.babel) {
      plugins += `\t\tbabel(${this.dump(this.config.babel)}),\n`
    }
    plugins += `],\n`


    let display = this.dump(prunedOptions)
    display = display.replace("plugins: 'x',", plugins)
    this.debug(`Executing rollup with options: ${display}`)
  }
}

export default RollupEs
