import extend from 'extend';
import path from 'path';
import fs from 'fs';
import glob from 'glob';
import spawn from 'cross-spawn';
import jsonfile from 'jsonfile';
import Util from 'gulp-util';
import stringify from 'stringify-object';
import notify from 'gulp-notify';
import shelljs from 'shelljs';
import eslint from 'gulp-eslint';
import debug from 'gulp-debug';
import gulpif from 'gulp-if';
import uglify from 'gulp-uglify';
import sourcemaps from 'gulp-sourcemaps';
import concat from 'gulp-concat';
import autoprefixer from 'gulp-autoprefixer';
import BrowserSync from 'browser-sync';
import changed from 'gulp-changed';
import imagemin from 'gulp-imagemin';
import merge from 'merge-stream';
import sass from 'gulp-sass';
import findup from 'findup-sync';
import scssLint from 'gulp-scss-lint';
import scssLintStylish from 'gulp-scss-lint-stylish';
import { rollup } from 'rollup';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import process from 'process';
import babel from 'rollup-plugin-babel';
import fs$1 from 'fs-extra';
import fileSyncCmp from 'file-sync-cmp';
import iconv from 'iconv-lite';
import { Buffer } from 'buffer';
import chalk from 'chalk';
import globAll from 'glob-all';
import del from 'del';
import rev from 'gulp-rev';
import cssnano from 'gulp-cssnano';
import mocha from 'gulp-mocha';
import BuildControl from 'build-control/src/buildControl';
import pathIsAbsolute from 'path-is-absolute';
import tmp from 'tmp';

const Ruby = class {
  static localPath(name) {
    let filename = `${name}`

    // if using source dir
    let filepath = path.join(__dirname, filename) // eslint-disable-line no-undef
    try {
      fs.statSync(filepath)
    }
    catch (error) {
      // if using dist dir
      filepath = path.join(__dirname, '../../src', filename) // eslint-disable-line no-undef
      fs.statSync(filepath)
    }

    return filepath
  }
}

const BaseDirectoriesCache = `.gulp-pipeline-rails.json`
const GemfileLock = `Gemfile.lock`

const Rails = class {
  static enumerateEngines() {

    let results = spawn.sync(Ruby.localPath('railsRunner.sh'), [Ruby.localPath('enumerateEngines.rb')], {
      sdtio: 'inherit',
      cwd: this.railsAppCwd()
    })

    //Util.log(stringify(results))
    if (results.stderr != '' || results.error != null) {
      Util.log(stringify(results))

      let msg = ''
      if (results.stderr) {
        msg += results.stderr
      }
      if (results.error) {
        msg += results.error
      }
      // message will be either error or stderr, so just grap both of them
      throw new Error(`Ruby script error: \n${results.stderr}${results.error}`)
    }
    return JSON.parse(results.stdout)
  }

  /**
   * We need a rails app to run our rails script runner.  Since this project could be a rails engine, find a rails app somewhere in or under the cwd.
   */
  static railsAppCwd() {
    let entries = glob.sync('**/bin/rails', {realpath: true})
    if (!entries || entries.length <= 0) {
      throw new Error(`Unable to find Rails application directory based on existence of 'bin/rails'`)
    }

    if (entries.length > 1) {
      throw new Error(`railsAppCwd() should only find one rails application but found ${entries}`)
    }
    return path.join(entries[0], '../..')
  }

  /**
   * Return the baseDirectories to search for assets such as images.  In rails, this means
   *  enumerating rails engines and collecting their root paths.  This is a lengthy process
   *  because you have to startup a rails environment to enumerate the engines, so we cache
   *  the baseDirectories in a file and compare it to the Gemfile.lock's modified time.  If
   *  the Gemfile.lock changes, we throw out the cache, enumerate the engines again and write
   *  a new cache file.
   *
   * @returns {{baseDirectories: string[]}}
   */
  static baseDirectories() {
    if (!this.changed(GemfileLock, BaseDirectoriesCache)) {
      return jsonfile.readFileSync(BaseDirectoriesCache)
    }
    else {
      Util.log(`Generating baseDirectories cache...`)
      try {
        fs.unlinkSync(BaseDirectoriesCache)
      } catch (error) {
        //ignore
      }

      Util.log(`Enumerating rails engines...`)
      let engines = Rails.enumerateEngines()
      //console.log(stringify(engines))

      let baseDirectories = ['./']
      for (let key of Object.keys(engines)) {
        baseDirectories.push(engines[key])
      }

      Util.log(`Writing baseDirectories cache...`)
      let result = {baseDirectories: baseDirectories}
      jsonfile.writeFileSync(BaseDirectoriesCache, result, {spaces: 2})
      return result
    }
  }

  static changed(sourceFileName, targetFileName) {
    let sourceStat = null
    let targetStat = null
    try {
      sourceStat = fs.statSync(sourceFileName)
      targetStat = fs.statSync(targetFileName)
    }
    catch (error) {
      return true
    }

    if (sourceStat.mtime > targetStat.mtime) {
      return true
    }
    else {
      return false
    }
  }
}

//import Util from 'gulp-util'

// NOTE: `source` and `watch` are node-glob options hashes. e.g. gulp.src(source.glob, source.options)

// Baseline is the simplest possible.  Take caution in modifying this one or make sure your platform preset overrides everything necessary.
const Baseline = {
  javascripts: {
    source: {
      glob: 'index.js',
      options: {cwd: 'src'},
      all: '**/*.js'
    },
    test: {
      glob: '**/*.js',
      options: {cwd: 'test'}
    },
    watch: {
      glob: '**/*.js',
      options: {cwd: 'src'}
    },
    dest: 'dist'
  },
  stylesheets: {
    source: {
      glob: ['*.scss', '!_*.scss'],  // do not compile all files, only non-underscored files
      options: {cwd: 'src'},
      all: '**/*.scss'
    },
    watch: {
      glob: '**/*.scss',
      options: {cwd: 'src'}
    },
    dest: 'dist'
  },
  images: {
    source: {options: {cwd: 'images'}},
    watch: {options: {cwd: 'images'}},
    dest: 'dist'
  },
  digest: {
    source: {options: {cwd: 'dist'}},
    watch: {options: {cwd: 'dist'}},
    dest: 'dist/digest'
  }
}

const PresetNodeSrc = {}

const PresetNodeLib = {
  javascripts: {
    source: { options: {cwd: 'lib'}},
    watch: {options: {cwd: 'lib'}}
    //test: {options: {cwd: 'test'}}
  },
  stylesheets: {
    source: {options: {cwd: 'lib'}},
    watch: {options: {cwd: 'lib'}}
  },
  images: {
    source: {options: {cwd: 'lib'}},
    watch: {options: {cwd: 'lib'}}
  }
}

// Rails, the oddball from a structure consideration
const railsJs = 'app/assets/javascripts'
const railsSs = 'app/assets/stylesheets'
const railsImages = 'app/assets/images'
const railsDest = 'public/assets/debug'
const PresetRails = {
  javascripts: {
    source: {
      glob: 'application.js',
      options: {cwd: railsJs}
    },
    watch: {options: {cwd: railsJs}},
    dest: railsDest
  },
  stylesheets: {
    source: {options: {cwd: railsSs}},
    watch: {options: {cwd: railsSs}},
    dest: railsDest
  },
  images: {
    source: {options: {cwd: railsImages}},
    watch: {options: {cwd: railsImages}},
    dest: railsDest
  },
  digest: {
    source: {options: {cwd: railsDest}},
    watch: {options: {cwd: railsDest}},
    dest: 'public/assets/digest'
  }
}


const Preset = class {
  static baseline(overrides = {}) {
    return extend(true, {}, Baseline, overrides)
  }

  static nodeLib(overrides = {}) {
    return extend(true, {}, Baseline, PresetNodeLib, overrides)
  }

  static nodeSrc(overrides = {}) {
    return extend(true, {}, Baseline, PresetNodeSrc, overrides)
  }

  static rails(overrides = {}) {

    return extend(true, {}, Baseline, PresetRails, Rails.baseDirectories(), overrides)
  }

  /**
   * Helper to quickly resolve the config from preset based on the presetType
   *
   * @param preset
   * @param configs - ordered set of overrides
   * @returns {source, watch, dest}
   */
  static resolveConfig(preset, ...configs) {
    if (!preset) {
      throw new Error(`Preset must be specified.  Please use one from the preset.js or specify a custom preset configuration.`)
    }

    let configOverrides = extend(true, {}, ...configs)
    //Util.log(`config before typeConfig: \n${stringify(configOverrides)}`)

    if (!configOverrides || !configOverrides.presetType) {
      throw new Error(`presetType must be specified in the config (usually the Default config).  See preset.js for a list of types such as javascripts, stylesheets, etc.`)
    }

    let typeConfig = null
    if (configOverrides.presetType !== 'macro') {
      typeConfig = preset[configOverrides.presetType]
      if (!typeConfig) {
        throw new Error(`Unable to resolve configuration for presetType: ${configOverrides.presetType} from preset: ${stringify(preset)}`)
      }
    }
    else {
      typeConfig = {}
    }

    // now that we've determined the typeConfig, overlay the overrides
    let resolved = extend(true, {}, typeConfig, configOverrides)

    //Util.log(`resolved config with preset: \n${stringify(resolved)}`)
    return resolved
  }
}

const Default$3 = {
  watch: true,
  debug: false
}

const Base = class {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(...configs) {
    this.config = extend(true, {}, Default$3, ...configs)
    this.debug(`[${this.constructor.name}] using resolved config: ${stringify(this.config)}`)
  }

  // ----------------------------------------------
  // protected
  requireValue(value, name) {
    if (value === undefined || value == null) {
      this.notifyError(`${name} must be defined, found: ${value}`)
    }
  }

  log(msg) {
    Util.log(msg)
  }

  debug(msg) {
    if (this.config.debug) {
      this.log(`[${Util.colors.cyan('debug')}][${Util.colors.cyan(this.constructor.name)}] ${msg}`)
    }
  }

  debugDump(msg, obj) {
    this.debug(`${msg}:\n${stringify(obj)}`)
  }

  notifyError(error, e) {
    this.log(error)
    throw e
  }

  debugOptions() {
    return {title: `[${Util.colors.cyan('debug')}][${Util.colors.cyan(this.taskName())}]`}
  }
}

const Default$2 = {
  debug: false,
  watch: true,
  task: {
    name: undefined,
    description: '',
    prefix: '', // task name prefix
    suffix: ''  // task name suffix
  }
}

const BaseGulp = class extends Base {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, ...configs) {
    super(Default$2, ...configs)
    this.gulp = gulp
  }


  taskName() {
    if (!this.config.task.name) {
      this.notifyError(`Expected ${this.constructor.name} to have a task name in the configuration.`)
    }
    return `${this.config.task.prefix}${this.config.task.name}${this.config.task.suffix}`
  }

  watchTaskName() {
    if (this.config.watch && this.config.watch.name) {
      return this.config.watch.name
    }
    else {
      return `${this.taskName()}:watch`
    }
  }

  notifyError(error, done, watching = false) {

    //this.debugDump('notifyError', error)

    let lineNumber = (error.lineNumber) ? `Line ${error.lineNumber} -- ` : ''
    let taskName = error.task || this.taskName()

    let title = `Task [${taskName}] failed`
    if (error.plugin) {
      title += ` in [${error.plugin}]`
    }

    notify({
      title: title,
      message: `${lineNumber}See console.`,
      sound: 'Sosumi' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
    }).write(error)

    let tag = Util.colors.black.bgRed
    let report = `\n${tag('    Task:')} [${Util.colors.cyan(taskName)}]\n`

    if (error.plugin) {
      report += `${tag('  Plugin:')} [${error.plugin}]\n`
    }

    report += `${tag('   Error:')} `

    if (error.message) {
      report += `${error.message}\n`
    }
    else {
      report += `${error}\n`
    }

    if (error.lineNumber) {
      report += `${tag('    Line:')} ${error.lineNumber}\n`
    }

    if (error.fileName) {
      report += `${tag('    File:')} ${error.fileName}\n`
    }
    this.log(report)



this.log(`watching? ${watching}`)
this.log(`done was provided? ${done}`)

    // Prevent the 'watch' task from stopping
    //if (!watching && this.gulp) {
    if (this.gulp) {
      // if this is not used, we see "Did you forget to signal async completion?", it also unfortunately logs more distracting information below.  But we need to exec the callback with an error to halt execution.

      this.donezo(done, error)
    }
    else {
      throw error
    }
  }

  /**
   * if done is provided, run it
   *
   * @param done
   */
  donezo(done, error = null) {
    if (done) {
      if (error) {
        this.debug('executing callback with error')
        done(error)
      }
      else {
        this.debug('executing callback without error')
        done()
      }
    }
    else {
      this.debug(`done callback was not provided`)
    }
  }

  /**
   * Wraps shellJs calls that act on the file structure to give better output and error handling
   * @param command
   * @param logResult - return output from the execution, defaults to true. If false, will return code instead
   * @param returnCode - defaults to false which will throw Error on error, true will return result code
   */
  exec(command, logResult = true, returnCode = false) {
    let options = {silent: true}
    if (this.config.cwd) {
      options['cwd'] = this.config.cwd
    }
    else {
      this.notifyError('cwd is required')
    }

    if (command.includes(`undefined`)) {
      this.notifyError(`Invalid command: ${command}`)
    }

    this.debug(`Executing \`${command}\` with cwd: ${options['cwd']}`)
    let shellResult = shelljs.exec(command, options)
    let output = this.logShellOutput(shellResult, logResult);

    if (shellResult.code === 0 || shellResult.code === 1) {

      // ---
      // determine the return value
      if (returnCode) {
        return shellResult.code
      }
      else {
        return output
      }
    }
    else {
      if (returnCode) {
        return shellResult.code
      }
      else {
        this.notifyError(`Command failed \`${command}\`, cwd: ${options.cwd}: ${shellResult.stderr}.`)
      }
    }
  }

  logShellOutput(shellResult, logResult) {
    //this.debug(`[exit code] ${shellResult.code}`)

    // ---
    // Log the result
    // strangely enough, sometimes useful messages from git are an stderr even when it is a successful command with a 0 result code
    let output = shellResult.stdout
    if (output == '') {
      output = shellResult.stderr
    }

    //this.log(stringify(shellResult))
    if (output != '') {
      if (logResult) {
        this.log(output)
      }
      else {
        this.debug(`[output] \n${output}`)
      }
    }
    return output;
  }
}

const Default$1 = {
  watch: true,
  debug: false
}

const BaseRecipe = class extends BaseGulp {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {

    super(gulp, extend(true, {},
      Default$1,
      {baseDirectories: preset.baseDirectories},
      Preset.resolveConfig(preset, ...configs)))

    // in case someone needs to inspect it later i.e. buildControl
    this.preset = preset

    if (this.createDescription !== undefined) {
      this.config.task.description = this.createDescription()
    }
    this.registerTask()
    this.registerWatchTask()
  }

  registerWatchTask() {
    if (this.config.watch) {
      // generate watch task e.g. sass:watch
      let name = this.watchTaskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)
      this.watchFn = () => {
        this.log(`[${Util.colors.green(name)}] watching ${this.config.watch.glob} ${stringify(this.config.watch.options)}...`)

        return this.gulp.watch(this.config.watch.glob, this.config.watch.options, (event) => {
          this.log(`File ${event.path} was ${event.type}, running ${this.taskName()}...`);
          return Promise
            .resolve(this.run(null, true))
            .then(() => this.logFinish())
        })
      }
      this.watchFn.description = this.createWatchDescription()
      this.gulp.task(name, this.watchFn)
    }
  }

  createWatchDescription() {
    return Util.colors.grey(`|___ watches ${this.config.watch.options.cwd}/${this.config.watch.glob}`)
  }

  registerTask() {
    if (this.config.task) {
      // generate primary task e.g. sass
      let name = this.taskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)

      // set a fn for use by the task, also used by aggregate/series/parallel
      this.taskFn = (done) => {
        //this.log(`Running task: ${Util.colors.green(name)}`)

        if (this.config.debug) {
          this.debugDump(`Executing ${Util.colors.green(name)} with options:`, this.config.options)
        }
        return this.run(done)
      }

      // set metadata on fn for discovery by gulp
      this.taskFn.displayName = name
      this.taskFn.description = this.config.task.description

      // register the task
      this.gulp.task(name, this.taskFn)
    }
  }

  taskName() {
    if (!this.config.task.name) {
      this.notifyError(`Expected ${this.constructor.name} to have a task name in the configuration.`)
    }
    return `${this.config.task.prefix}${this.config.task.name}${this.config.task.suffix}`
  }

  watchTaskName() {
    if (this.config.watch && this.config.watch.name) {
      return this.config.watch.name
    }
    else {
      return `${this.taskName()}:watch`
    }
  }

  logFinish(message = 'finished.') {
    this.log(`[${Util.colors.green(this.taskName())}] ${message}`)
  }
}

const Default = {
  debug: false,
  presetType: 'javascripts',
  task: {
    name: 'eslint'
  },
  source: {
    glob: '**/*.js'
  },
  options: {}
}

const EsLint = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default, ...configs))
  }

  createDescription(){
    return `Lints ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {
    // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(eslint(this.config.options))
      .pipe(eslint.format()) // outputs the lint results to the console. Alternatively use eslint.formatEach() (see Docs).
      .pipe(gulpif(!watching, eslint.failAfterError())) // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })

    // FIXME: even including any remnant of JSCS at this point broke everything through the unfound requirement of babel 5.x through babel-jscs.  I can't tell where this occurred, but omitting gulp-jscs for now gets me past this issue.  Revisit this when there are clear updates to use babel 6
    //.pipe(jscs())      // enforce style guide
    //.pipe(stylish())  // log style errors
    //.pipe(jscs.reporter('fail')) // fail on error
  }
}

const Default$4 = {
  debug: false,
  presetType: 'javascripts',
  task: {
    name: 'uglify'
  },
  source: {
    glob: '**/*.js'
  },
  options: {
    compress: {
      warnings: true
    },
    mangle: false,
    preserveComments: /^!|@preserve|@license|@cc_on/i
  }
}

const Uglify = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default$4, ...configs))
  }

  createDescription(){
    return `Uglifies ${this.config.source.options.cwd}/${this.config.source.glob} to ${this.config.dest}/${this.config.options.dest}`
  }

  run(done, watching = false) {
    // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
    let bundle = this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(sourcemaps.init())
      .pipe(concat(this.config.options.dest))
      .pipe(uglify(this.config.options))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })
      .pipe(this.gulp.dest(this.config.dest))

    return bundle
  }
}

const AutoprefixerDefault = {
  options: {  // from bootstrap
    browsers: [
      //
      // Official browser support policy:
      // http://v4-alpha.getbootstrap.com/getting-started/browsers-devices/#supported-browsers
      //
      'Chrome >= 35', // Exact version number here is kinda arbitrary
      // Rather than using Autoprefixer's native "Firefox ESR" version specifier string,
      // we deliberately hardcode the number. This is to avoid unwittingly severely breaking the previous ESR in the event that:
      // (a) we happen to ship a new Bootstrap release soon after the release of a new ESR,
      //     such that folks haven't yet had a reasonable amount of time to upgrade; and
      // (b) the new ESR has unprefixed CSS properties/values whose absence would severely break webpages
      //     (e.g. `box-sizing`, as opposed to `background: linear-gradient(...)`).
      //     Since they've been unprefixed, Autoprefixer will stop prefixing them,
      //     thus causing them to not work in the previous ESR (where the prefixes were required).
      'Firefox >= 31', // Current Firefox Extended Support Release (ESR)
      // Note: Edge versions in Autoprefixer & Can I Use refer to the EdgeHTML rendering engine version,
      // NOT the Edge app version shown in Edge's "About" screen.
      // For example, at the time of writing, Edge 20 on an up-to-date system uses EdgeHTML 12.
      // See also https://github.com/Fyrd/caniuse/issues/1928
      'Edge >= 12',
      'Explorer >= 9',
      // Out of leniency, we prefix these 1 version further back than the official policy.
      'iOS >= 8',
      'Safari >= 8',
      // The following remain NOT officially supported, but we're lenient and include their prefixes to avoid severely breaking in them.
      'Android 2.3',
      'Android >= 4',
      'Opera >= 12'
    ]
  }
}

const Autoprefixer = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, AutoprefixerDefault, ...configs)
  }

  run(done, watching = false) {
    // FIXME: is this right or wrong?  this class initially was extracted for reuse of Default options
    return this.gulp.src(this.config.source)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(autoprefixer(this.config.options))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })
      .pipe(this.gulp.dest(this.config.dest))
  }
}

const Default$5 = {
  debug: false,
  presetType: 'images',
  task: {
    name: 'images'
  },
  watch: {
    glob: '**',
    options: {
      //cwd: ** resolved from preset **
    }
  },
  source: {
    // baseDirectories: [] ** resolved from preset **
    glob: '**',
    options: {
      //cwd: ** resolved from preset **
    }
  },
  options: {}
}

const Images = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default$5, ...configs))
    this.browserSync = BrowserSync.create()
  }

  createDescription() {
    return `Minifies change images from ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {

    var tasks = this.config.baseDirectories.map((baseDirectory) => {
      // join the base dir with the relative cwd
      return this.runOne(done, path.join(baseDirectory, this.config.source.options.cwd), watching)
    })
    return merge(tasks);
  }

  runOne(done, cwd, watching) {

    // setup a run with a single cwd a.k.a base directory FIXME: perhaps this could be in the base recipe? or not?
    let options = extend({}, this.config.source.options)
    options.cwd = cwd
    this.debug(`src: ${cwd}/${this.config.source.glob}`)

    return this.gulp.src(this.config.source.glob, options)
      .pipe(changed(this.config.dest)) // ignore unchanged files
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(imagemin(this.config.options))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })
      .pipe(this.gulp.dest(this.config.dest))
      .pipe(this.browserSync.stream())
  }
}

const node_modules = findup('node_modules')

const Default$6 = {
  debug: false,
  presetType: 'stylesheets',
  task: {
    name: 'sass'
  },
  options: {
    // WARNING: `includePaths` this should be a fully qualified path if overriding
    //  @see https://github.com/sass/node-sass/issues/1377
    includePaths: [node_modules] // this will find any node_modules above the current working directory
  },
  // capture defaults from autoprefixer class
  autoprefixer: {
    options: AutoprefixerDefault.options
  }
}

const Sass = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default$6, ...configs))
    this.browserSync = BrowserSync.create()
  }

  createDescription() {
    return `Compiles ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {
    // add debug for importing problems (can be very helpful)
    if(this.config.debug && this.config.options.importer === undefined) {
      this.config.options.importer = (url, prev, done) => {
        this.debug(`importing ${url} from ${prev}`)
        done({file: url})
      }
    }

    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(sourcemaps.init())
      .pipe(sass(this.config.options))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })
      .pipe(autoprefixer(this.config.autoprefixer.options))
      .pipe(sourcemaps.write())
      .pipe(this.gulp.dest(this.config.dest))
      .pipe(this.browserSync.stream())
  }
}

const Default$7 = {
  debug: false,
  presetType: 'stylesheets',
  task: {
    name: 'scsslint'
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
    super(gulp, preset, extend(true, {}, Default$7, ...configs))
  }

  createDescription(){
    return `Lints ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {
    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(scssLint(this.config.options))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })
  }
}

const Default$8 = {
  debug: false,
  watch: true  // register a watch task that aggregates all watches and runs the full sequence
}

const Aggregate = class extends BaseGulp {

  /**
   *
   * @param gulp - gulp instance
   * @param configs - customized overrides
   */
  constructor(gulp, taskName, recipes, ...configs) {
    super(gulp, Default$8, {task: {name: taskName}}, ...configs)
    this.recipes = recipes
    this.registerTask(this.taskName())

    if (this.config.watch) {
      this.registerWatchTask(this.watchTaskName())
    }
  }

  createHelpText() {
    //let taskNames = new Recipes().toTasks(this.recipes)
    //
    //// use the config to generate the dynamic help
    //return `Runs [${taskNames.join(', ')}]`
    return ''
  }

  createWatchHelpText() {
    let taskNames = this.watchableRecipes().reduce((a, b) => {
      return a.concat(b.taskName())
    }, [])

    return Util.colors.grey(`|___ aggregates watches from [${taskNames.join(', ')}] and runs all tasks on any change`)
  }

  registerTask(taskName) {
    //let tasks = this.toTasks(this.recipes)
    //this.debug(`Registering task: ${Util.colors.green(taskName)} for ${stringify(tasks)}`)
    this.gulp.task(taskName, this.recipes)
    this.recipes.description = this.createHelpText()
  }

  registerWatchTask(taskName) {
    // generate watch task
    let watchableRecipes = this.watchableRecipes()
    if (watchableRecipes.length < 1) {
      this.debug(`No watchable recipes for task: ${Util.colors.green(taskName)}`)
      return
    }

    this.debug(`Registering task: ${Util.colors.green(taskName)}`)

    // on error ensure that we reset the flag so that it runs again
    this.gulp.on('error', () => {
      this.debug(`Yay! listened for the error and am able to reset the running flag!`)
      this.recipes.running = false
    })


    let watchFn = () => {
      // watch the watchable recipes and make them #run the series
      for (let recipe of watchableRecipes) {
        this.log(`[${Util.colors.green(taskName)}] watching for ${recipe.taskName()} ${recipe.config.watch.glob}...`)

        // declare this in here so we can use different display names in the log
        let runFn = (done) => {
          // ensure that multiple watches do not run the entire set of recipes multiple times on a single change
          if (this.recipes.running) {
            this.debug('Multiple matching watchers, skipping this one...')
            done()
            return
          }
          else {
            this.debug('Allowing it to run....')
            this.recipes.running = true
          }

          let finishFn = () => {
            this.log(`[${Util.colors.green(taskName)}] finished`)
            this.recipes.running = false
          }

          this.gulp.series(this.recipes, finishFn, done)()
        }
        runFn.displayName = `${recipe.taskName()} watcher`

        let watcher = this.gulp.watch(recipe.config.watch.glob, recipe.config.watch.options, runFn)
        let recipeName = Util.colors.grey(`(${recipe.taskName()})`)
        // add watchers for logging/information
        watcher.on('add', (path) => {
          if (!this.recipes.running) {
            this.log(`[${Util.colors.green(taskName)} ${recipeName}] ${path} was added, running...`)
          }
        })
        watcher.on('change', (path) => {
          if (!this.recipes.running) {
            this.log(`[${Util.colors.green(taskName)} ${recipeName}] ${path} was changed, running...`)
          }
        })
        watcher.on('unlink', (path) => {
          if (!this.recipes.running) {
            this.log(`[${Util.colors.green(taskName)} ${recipeName}] ${path} was deleted, running...`)
          }
        })
      }
    }


    watchFn.description = this.createWatchHelpText()
    this.gulp.task(taskName, watchFn)
  }

  flatten(list) {
    return list.reduce((a, b) =>
      // parallel and series set `.recipes` on the function as metadata
      a.concat((typeof b === "function" && b.recipes) ? this.flatten(b.recipes) : b), [])
  }

  flattenedRecipes() {
    let recipes = this.flatten([this.recipes])
    this.debugDump(`flattenedRecipes`, recipes)
    return recipes
  }

  watchableRecipes() {
    // create an array of watchable recipes
    let watchableRecipes = []
    for (let recipe of this.flattenedRecipes()) {
      if ((typeof recipe !== "string") && recipe.config.watch) {
        watchableRecipes.push(recipe)
      }
    }
    return watchableRecipes
  }
}

const node_modules$1 = findup('node_modules')


const Default$9 = {
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

// This nodeResolve configuration is not used unless it is within the plugins: [nodeResolve(this.config.nodeResolve.options)] - pass this.config.nodeResolve.enabled == true in config to enable default options
const NodeResolve = {
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
      extensions: [ '.js', '.json' ]
    }
  }
}

const CommonJs = {
  commonjs: {
    enabled: false,
    options: {
      include: `${node_modules$1}/**`,
      //exclude: [ `${node_modules}/foo/**', `${node_modules}/bar/**` ],

      // search for files other than .js files (must already be transpiled by a previous plugin!)
      extensions: [ '.js' ] // defaults to [ '.js' ]
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

    super(gulp, preset, extend(true, {}, Default$9, NodeResolve, CommonJs, config))

    // Utilize the presets to get the dest cwd/base directory, then add the remaining passed-in file path/name
    this.config.options.dest = `${this.config.dest}/${this.config.options.dest}`

    //----------------------------------------------
    // plugins order: nodeResolve, commonjs, babel

    // Add commonjs before babel
    if(this.config.commonjs.enabled) {
      this.debug('Adding commonjs plugin')
      // add at the beginning
      this.config.options.plugins.unshift(commonjs(this.config.commonjs.options))
    }

    // Add nodeResolve before (commonjs &&|| babel)
    if(this.config.nodeResolve.enabled) {
      this.debug('Adding nodeResolve plugin')
      // add at the beginning
      this.config.options.plugins.unshift(nodeResolve(this.config.nodeResolve.options))
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
      throw new Error(`Unable to resolveEntry() for source: ${stringify(this.config.source)} from ${process.cwd()}`)
    }

    if (entry.length > 1) {
      throw new Error(`resolveEntry() should only find one entry point but found ${entry} for source: ${stringify(this.config.source)}`)
    }
    return entry[0]
  }

  createDescription(){
    return `Rollup ${this.config.source.options.cwd}/${this.config.source.glob} in the ${this.config.options.format} format to ${this.config.options.dest}`
  }

  run(done, watching = false) {
    let options = extend(true, {
        entry: this.resolveEntry(),
        onwarn: (message) => {
          //this.notifyError(message, watching)
          this.log(message)
        }
      },
      this.config.options)

    if(this.config.debug) {
      let prunedOptions = extend(true, {}, options)
      prunedOptions.plugins = `[ (count: ${this.config.options.plugins.length}) ]`
      this.debug(`Executing rollup with options: ${stringify(prunedOptions)}`)
    }

    return rollup$1(options)
      .then((bundle) => {
        return bundle.write(options)
      })
      .catch((error) => {
        error.plugin = 'rollup'
        this.notifyError(error, done, watching)
      })
  }
}

const Default$10 = {
  task: {
    name: 'rollup:cjs'
  },
  options: {
    //dest: '', // required
    format: 'cjs',
    plugins: [babel({
      babelrc: false,
      presets: ['es2015-rollup']
    })]
  },
  nodeResolve: {
    enabled: true // bundle a full package with dependencies?
  },
  commonjs: {
    enabled: true // convert dependencies to commonjs modules for rollup
  }
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const RollupCjs = class extends RollupEs {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default$10, ...configs))
  }
}

const Default$11 = {
  task: {
    name: 'rollup:iife'
  },
  options: {
    //dest: '', // required
    format: 'iife'
  },
  nodeResolve: {
    enabled: true // by nature, iife is the full package so bundle up those dependencies.
  }
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const RollupIife = class extends RollupCjs {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default$11, ...configs))
  }
}

const Default$12 = {
  task: {
    name: 'rollup:amd'
  },
  options: {
    //dest: '', // required
    format: 'amd'
  }
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const RollupAmd = class extends RollupCjs {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default$12, ...configs))
  }
}

const Default$13 = {
  task: {
    name: 'rollup:umd'
  },
  options: {
    //dest: '', // required
    format: 'umd'
  }
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const RollupUmd = class extends RollupCjs {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default$13, ...configs))
  }
}

const isWindows = (process.platform === 'win32')
const pathSeparatorRe = /[\/\\]/g;

/**
 * Implementation can use our base class, but is exposed as static methods in the exported File class
 *
 * TODO: reducing the amount of code by using other maintained libraries would be fantastic.  Worst case, break most of this into it's own library?
 *
 *  @credit to grunt for the grunt.file implementation. See license for attribution.
 */
const FileImplementation = class extends Base {
  constructor(config = {}) {
    super({encoding: "utf8"}, config)
  }

  // Read a file, optionally processing its content, then write the output.
  copy(srcpath, destpath, options) {
    if (!options) {
      options = {}
    }
    // If a process function was specified, process the file's source.

    // If the file will be processed, use the encoding as-specified. Otherwise, use an encoding of null to force the file to be read/written as a Buffer.
    let readWriteOptions = options.process ? options : {encoding: null}

    let contents = this.read(srcpath, readWriteOptions)
    if (options.process) {
      this.debug('Processing source...')
      try {
        contents = options.process(contents, srcpath)
      }
      catch (e) {
        this.notifyError(`Error while executing process function on ${srcpath}.`, e)
      }
    }
    // Abort copy if the process function returns false.
    if (contents === false) {
      this.debug('Write aborted, no contents.')
    }
    else {
      this.write(destpath, contents, readWriteOptions)
    }
  }

  syncTimestamp(src, dest) {
    let stat = fs$1.lstatSync(src)
    if (path.basename(src) !== path.basename(dest)) {
      return
    }

    if (stat.isFile() && !fileSyncCmp.equalFiles(src, dest)) {
      return
    }

    let fd = fs$1.openSync(dest, isWindows ? 'r+' : 'r')
    fs$1.futimesSync(fd, stat.atime, stat.mtime)
    fs$1.closeSync(fd)
  }

  write(filepath, contents, options) {
    if (!options) {
      options = {}
    }
    // Create path, if necessary.
    this.mkdir(path.dirname(filepath))
    try {
      // If contents is already a Buffer, don't try to encode it. If no encoding was specified, use the default.
      if (!Buffer.isBuffer(contents)) {
        contents = iconv.encode(contents, options.encoding || this.config.encoding)
      }
      // Actually write this.
      fs$1.writeFileSync(filepath, contents)

      return true
    }
    catch (e) {
      this.notifyError(`Unable to write ${filepath} file (Error code: ${e.code}).`, e)
    }
  }

  // Read a file, return its contents.
  read(filepath, options) {
    if (!options) {
      options = {}
    }
    let contents
    this.debug(`Reading ${filepath}...`)
    try {
      contents = fs$1.readFileSync(String(filepath))
      // If encoding is not explicitly null, convert from encoded buffer to a
      // string. If no encoding was specified, use the default.
      if (options.encoding !== null) {
        contents = iconv.decode(contents, options.encoding || this.config.encoding)
        // Strip any BOM that might exist.
        if (!this.config.preserveBOM && contents.charCodeAt(0) === 0xFEFF) {
          contents = contents.substring(1)
        }
      }

      return contents
    }
    catch (e) {
      this.notifyError('Unable to read "' + filepath + '" file (Error code: ' + e.code + ').', e)
    }
  }

  /**
   * Like mkdir -p. Create a directory and any intermediary directories.
   * @param dirpath
   * @param mode
   */
  mkdir(dirpath, mode) {
    // Set directory mode in a strict-mode-friendly way.
    if (mode == null) {
      mode = parseInt('0777', 8) & (~process.umask())
    }
    dirpath.split(pathSeparatorRe).reduce((parts, part) => {
      parts += part + '/'
      let subpath = path.resolve(parts)
      if (!this.exists(subpath)) {
        try {
          fs$1.mkdirSync(subpath, mode)
        }
        catch (e) {
          this.notifyError(`Unable to create directory ${subpath} (Error code: ${e.code}).`, e)
        }
      }
      return parts
    }, '')
  }

  /**
   * Match a filepath or filepaths against one or more wildcard patterns.
   * @returns true if any of the patterns match.
   */
  isMatch(...args) {
    return this.match(...args).length > 0
  }

  exists(...args) {
    let filepath = path.join(...args)
    return fs$1.existsSync(filepath)
  }

  isDir(...args) {
    let filepath = path.join(...args)
    return this.exists(filepath) && fs$1.statSync(filepath).isDirectory()
  }

  detectDestType(dest) {
    if (dest.endsWith('/')) {
      return 'directory'
    }
    else {
      return 'file'
    }
  }
}


const File = class {
  static copy(srcpath, destpath, options) {
    return instance.copy(srcpath, destpath, options)
  }

  static syncTimestamp(src, dest) {
    return instance.syncTimestamp(src, dest)
  }

  static write(filepath, contents, options) {
    return instance.write(filepath, contents, options)
  }

  static read(filepath, options) {
    return instance.read(filepath, options)
  }

  static isDir(...args) {
    return instance.isDir(...args)
  }

  static mkdir(dirpath, mode) {
    return instance.mkdir(dirpath, mode)
  }

  static isMatch(...args) {
    return instance.isMatch(...args)
  }

  static exists(...args) {
    return instance.exists(...args)
  }

  static detectDestType(dest) {
    return instance.detectDestType(dest)
  }
}

//  singleton
let instance = new FileImplementation()

const Default$14 = {
  debug: false,
  watch: false,
  presetType: 'macro',
  task: {
    name: 'copy'
  },
  process: (content, srcpath) => {  // eslint-disable-line no-unused-vars
    return content
  }, // allows modification of the file content before writing to destination
  encoding: 'utf8',
  mode: false,            // True will copy the existing file/directory permissions, otherwise set the mode e.g. 0644
  timestamp: false,       // Preserve the timestamp attributes(atime and mtime) when copying files. Timestamp will not be preserved
  //                        //    when the file contents or name are changed during copying.
  //preserveBOM: false,     // Whether to preserve the BOM on this.read rather than strip it.

  source: {
    glob: undefined,      // [] or string glob pattern https://github.com/isaacs/node-glob#glob-primer
    options: {            // https://github.com/isaacs/node-glob#options
      cwd: process.cwd()  // base path
    }
  },
  dest: undefined,         // base path
  options: {}
}

/**
 *  Copy files to a destination with permissions and processing options.
 *
 *  TODO: reducing the amount of code by using other maintained libraries would be fantastic.  Worst case, break most of this into it's own library?
 *
 *  @credit to grunt and grunt-contrib-copy for the implementation. See license for attribution.
 */
const Copy = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default$14, ...configs))

    this.requireValue(this.config.source.glob, `source.glob`)
    this.requireValue(this.config.source.options.cwd, `source.options.cwd`)
    this.requireValue(this.config.dest, `dest`)

    // ensure array
    if (!Array.isArray(this.config.source.glob)) {
      this.config.source.glob = [this.config.source.glob]
    }
  }

  createDescription() {
    return `Copies ${this.config.source.options.cwd}/${this.config.source.glob} to ${this.config.dest}`
  }

  chmod(from, to) {
    if (this.config.mode !== false) {
      fs$1.chmodSync(to, (this.config.mode === true) ? fs$1.lstatSync(from).mode : this.config.mode)
    }
  }

  run(done) {
    try {
      let dirs = {}
      let tally = {
        dirs: 0,
        files: 0
      }
      let copyOptions = {
        encoding: this.config.encoding,
        process: this.config.process
      }

      let options = extend(true, {}, this.config.source.options, {realpath: true})
      let pattern = this.config.source.glob
      this.log(`Copying ${options.cwd}/${pattern}...`)
      for (let fromFullPath of globAll.sync(pattern, options)) {
        let from = path.relative(process.cwd(), fromFullPath)
        let toRelative = path.relative(options.cwd, from) // grab the path of the file relative to the cwd of the source cwd - allows nesting
        let to = path.join(this.config.dest, toRelative)

        if (File.isDir(from)) {
          this.log(`\t${chalk.cyan(to)}`)
          File.mkdir(to)
          this.chmod(from, to)
          dirs[from] = to
          tally.dirs++
        }
        else {
          this.log(`\t-> ${chalk.cyan(to)}`)
          File.copy(from, to, copyOptions)
          if (this.config.timestamp) {
            File.syncTimestamp(from, to)
          }
          this.chmod(from, to)
          tally.files++
        }
      }

      if (this.config.timestamp) {
        for (let from of Object.keys(dirs)) {
          File.syncTimestamp(from, dirs[from])
        }
      }

      let msg = ''
      if (tally.dirs) {
        msg += `Created ${chalk.cyan(tally.dirs.toString()) + (tally.dirs === 1 ? ' directory' : ' directories')}`
      }

      if (tally.files) {
        msg += (tally.dirs ? ', copied ' : 'Copied ') + chalk.cyan(tally.files.toString()) + (tally.files === 1 ? ' file' : ' files')
      }

      this.log(msg)
      this.donezo(done)
    }
    catch (error) {
      this.notifyError(error, done)
    }
  }
}

const Default$16 = {
  debug: false,
  watch: false,
  sync: true  // necessary so that tasks can be run in a series, can be overriden for other purposes
}

const BaseClean = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$16, config))
  }

  createDescription(){
    // use the config to generate the dynamic help
    return `Cleans ${this.config.dest}`
  }

  run(done, watching = false) {
    if (this.config.sync) {
      let paths = del.sync(this.config.dest)
      this.logDeleted(paths)
    }
    else {
      return del(this.config.dest)
        .then((paths) => {
          this.logDeleted(paths)
        })
        .catch((error) => {
          error.plugin = 'del'
          this.notifyError(error, watching)
        })
    }

    this.donezo(done)
  }

  logDeleted(paths) {
    if (paths.length > 0) {
      this.log(`Deleted files and folders:`)
      for(let path of paths){
        this.log(`    ${path}`)
      }
    }
  }
}

const Default$15 = {
  presetType: 'images',
  task: {
    name: 'clean:images'
  }
}

const CleanImages = class extends BaseClean {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default$15, ...configs))
  }
}

const Default$17 = {
  presetType: 'stylesheets',
  task: {
    name: 'clean:stylesheets'
  }
}

const CleanStylesheets = class extends BaseClean {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default$17, ...configs))
  }
}

const Default$18 = {
  presetType: 'javascripts',
  task: {
    name: 'clean:javascripts'
  }
}

const CleanJavascripts = class extends BaseClean {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default$18, ...configs))
  }
}

const Default$19 = {
  presetType: 'digest',
  task: {
    name: 'clean:digest'
  }
}

const CleanDigest = class extends BaseClean {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default$19, ...configs))
  }
}

const Default$20 = {
  debug: false,
  watch: false,
  presetType: 'macro',
  task: {
    name: 'clean',
    description: 'Cleans images, stylesheets, and javascripts.'
  }
}

const Clean = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default$20, ...configs)

    this.cleanImages = new CleanImages(gulp, preset, ...configs)
    this.cleanStylesheets = new CleanStylesheets(gulp, preset, ...configs)
    this.cleanJavascripts = new CleanJavascripts(gulp, preset, ...configs)
    this.cleanDigest = new CleanDigest(gulp, preset, ...configs)
  }

  run(done) {
    this.cleanImages.run()
    this.cleanStylesheets.run()
    this.cleanJavascripts.run()
    this.cleanDigest.run()

    this.donezo(done)
  }
}

const Default$21 = {
  debug: false,
  presetType: 'digest',
  task: {
    name: 'rev'
  },
  watch: {
    glob: ['**', '!digest', '!digest/**', '!*.map'],
    options: {
      //cwd: ** resolved from preset **
    }
  },
  source: {
    glob: ['**', '!digest', '!digest/**', '!*.map'],
    options: {
      //cwd: ** resolved from preset **
    }
  },
  options: {}
}

const Rev = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default$21, ...configs))
    this.browserSync = BrowserSync.create()
  }

  createDescription() {
    return `Adds revision digest to assets from ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {

    // FIXME merge in the clean as a task


    return this.gulp.src(this.config.source.glob, this.config.source.options)
      //.pipe(changed(this.config.dest)) // ignore unchanged files
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(rev(this.config.options))
      .pipe(this.gulp.dest(this.config.dest))
      .pipe(rev.manifest())
      .pipe(this.gulp.dest(this.config.dest))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })
      .pipe(this.browserSync.stream())

  }
}

const Default$22 = {
  debug: false,
  presetType: 'digest',
  task: {
    name: 'minifyCss'
  },
  watch: {
    glob: ['digest/**.css'],
    options: {
      //cwd: ** resolved from preset **
    }
  },
  source: {
    glob: ['digest/**.css'],
    options: {
      //cwd: ** resolved from preset **
    }
  },
  options: {}
}

/**
 * Recipe to be run after Rev or any other that places final assets in the digest destination directory
 */
const MinifyCss = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default$22, ...configs))
    this.browserSync = BrowserSync.create()
  }

  createDescription() {
    return `Minifies digest css from ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {

    // FIXME merge in the clean as a task


    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(cssnano(this.config.options))
      .pipe(this.gulp.dest(this.config.dest))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })
      .pipe(this.browserSync.stream())

  }
}

const Default$23 = {
  debug: false,
  presetType: 'javascripts',
  task: {
    name: 'mocha'
  },
  options: {}
}

const Mocha = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    // resolve watch cwd based on test cwd
    super(gulp, preset, extend(true, {},
      Default$23,
      {watch: {options: {cwd: Preset.resolveConfig(preset, Default$23, ...configs).test.options.cwd}}},
      ...configs))
  }

  createDescription() {
    return `Tests ${this.config.test.options.cwd}/${this.config.test.glob}`
  }

  run(done, watching = false) {
    let bundle = this.gulp.src(this.config.test.glob, this.config.test.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(mocha({reporter: 'nyan'})) // gulp-mocha needs filepaths so you can't have any plugins before it
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })

    return bundle
  }
}

/**
 *  This is the base for publish recipes using BuildControl
 */
const Default$25 = {

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
    super(gulp, preset, extend(true, {}, Default$25, config))

    // use the dir as the cwd to the BuildControl class
    this.config.options = extend(true, {debug: this.config.debug, cwd: this.config.dir}, this.config.options)
  }
}

const Default$24 = {
  task: {
    name: 'prepublish',
    description: 'Checks tag name and ensures directory has all files committed.'
  },
  options: {
    tag: {
      existsFailure: true
    }
  }
}

/**
 *  This recipe will run a preflight check on publishing to ensure tag name and commits are ready to go.
 *
 *  Run this before long running tests to error your build quickly.
 */
const Prepublish = class extends BasePublish {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default$24, ...configs))
  }

  run(done) {
    let buildControl = new BuildControl(this.config.options)
    buildControl.prepublishCheck()

    this.donezo(done)
  }
}

/**
 *  This recipe will keep your source branch clean but allow you to easily push your
 *  dist files to a separate branch, all while keeping track of the origin commits.
 *
 *  Did I mention it will autotag based on your package.json?
 *
 *  Typically, your build tools put compiled files in dist.  A clean build packages typically needs to consist of
 *  1. package metadata - package.json or bower.json
 *  2. license
 *  3. compiled dist files
 *  4. source files - Javascript ES projects, as well as SCSS libraries for example need to publish source
 *
 *  To keep your source branch clean with this recipe's default configuration, add the following to .gitignore:
 *  - build
 *  - dist
 *
 *  Run this recipe, it will delete/create the `build` dir, copy the files above, and commit/push (changes from remote)
 *  to the `dist` branch.  Now you have clean separation of source and dist.
 *
 *  Have long running maintenance on an old version?  Publish to a different dist branch like { options: {branch: 'dist-v3'} }
 */
const Default$26 = {
  //debug: true,
  npm: {
    bump: true,
    publish: true
  },
  readme: {
    enabled: true,
    name: 'README.md',
    template: `# %sourceName%

%sourceTagLink% built from commit %sourceCommitLink% on branch \`%sourceBranch%\`. See the [README](../..) for more details

---
<sup>Built and published by [gulp-pipeline](https://github.com/alienfast/gulp-pipeline) using [build-control](https://github.com/alienfast/build-control)</sup>
`
  },
  task: {
    name: 'publishBuild',
    description: 'Assembles and pushes the build to a branch'
  }
}

const PublishBuild = class extends BasePublish {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default$26, ...configs))
  }

  run(done) {
    let buildControl = new BuildControl(this.config.options)

    // bump the version and commit to git
    if(this.config.npm.bump) {
      buildControl.npm.bump()
    }

    this.prepareBuildFiles()

    this.generateReadme(buildControl)

    // run the commit/tagging/pushing
    buildControl.run()

    // publish to npm
    if(this.config.npm.publish) {
      buildControl.npm.publish()
    }

    done()
  }

  generateReadme(buildControl) {
    // generate a readme on the branch if one is not copied in.
    if (this.config.readme.enabled) {
      let readme = path.join(this.config.dir, this.config.readme.name)
      if (fs$1.existsSync(readme)) {
        this.log(`Found readme at ${readme}.  Will not generate a new one from the template.  Turn this message off with { readme: {enabled: false} }`)
      }
      else {
        fs$1.writeFileSync(readme, buildControl.interpolate(this.config.readme.template))
      }
    }
  }

  /**
   * Copy all the configured sources to the config.dir directory
   */
  prepareBuildFiles() {
    let buildDir = this.config.dir
    this.debug(`Using build directory: ${buildDir}`)

    // copy preset type files
    for (let type of this.config.source.types) {
      let typePreset = this.preset[type]

      this.log(`Copying ${typePreset.source.options.cwd}/${typePreset.source.all}...`)
      for (let name of glob.sync(typePreset.source.all, typePreset.source.options)) {
        let from = path.join(typePreset.source.options.cwd, name)
        let to = path.join(buildDir, from)
        this.log(`\t...to ${to}`)
        fs$1.copySync(from, to)
      }
    }

    // copy any additional configured files
    for (let fileGlob of this.config.source.files) {

      this.log(`Copying ${fileGlob}...`)
      for (let fromFullPath of glob.sync(fileGlob, {realpath: true})) {
        let from = path.relative(process.cwd(), fromFullPath)
        let to = path.join(buildDir, from)
        this.log(`\t...to ${to}`)
        fs$1.copySync(from, to)
      }
    }
  }

  resolvePath(cwd, base = process.cwd()) {
    if (!pathIsAbsolute(cwd)) {
      return path.join(base, cwd)
    }
    else {
      return cwd
    }
  }
}

const Default$27 = {
  watch: false,
  presetType: 'macro',
  task: {
    name: 'jekyll',
    description: 'Builds a jekyll site'
  },
  cwd: process.cwd(),
  options: {
    baseCommand: 'bundle exec',
    config: '_config.yml',
    incremental: false,
    raw: undefined // 'baseurl: "/bootstrap-material-design"'
  }
}

const Jekyll = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default$27, ...configs)
  }

  run(done) {
    let config = `--config ${this.config.options.config}`

    let rawConfigFile = this.rawConfig()

    // If raw is specified, add the temporary config file to the list of configs passed into the jekyll command
    if (rawConfigFile) {
      config += `,${rawConfigFile}`
    }

    this.exec(`${Ruby.localPath(('rubyRunner.sh'))} ${this.config.options.baseCommand} jekyll build ${config}`)

    this.donezo(done)
  }

  // Create temporary config file if needed
  rawConfig() {
    if (this.config.options.raw) {
      // Tmp file is only available within the context of this function
      let tmpFile = tmp.fileSync({prefix: '_config.', postfix: '.yml'})

      // Write raw to file
      fs$1.writeFileSync(tmpFile.name, this.config.options.raw)

      // return the file path
      return tmpFile.name
    }
    else {
      return null
    }
  }
}

const Recipes = class extends Base {

  constructor(config = {debug: false}) {
    super(config)
  }

  /**
   * Prefer to return the taskFn instead of a string, but return the string if that's all that is given to us.
   *
   * @param recipe
   * @returns {*}
   */
  toTask(recipe) {
    let taskName = null
    if (typeof recipe === "string") {
      // any given task name should be returned as-is
      taskName = recipe
      this.debug(`toTask(): ${taskName}`)
    }
    else {
      if (typeof recipe === "function") {
        // any given fn should be return as-is i.e. series/parallel
        taskName = recipe
      }
      else {
        // any recipe should be converted to string task name
        taskName = recipe.taskFn
      }
      this.debug(`toTask(): ${taskName.name || taskName.displayName}`)
    }
    return taskName
  }

  /**
   * Yield the nearest set of task names - return nested series/parallel fn - do not follow them and flatten them (they will do that themselves if using the helper methods)
   *
   * @param recipes
   * @returns {Array}
   */
  toTasks(recipes, tasks = []) {
    this.debugDump('toTasks: recipes', recipes)

    for (let recipe of recipes) {
      //this.debugDump(`recipe taskName[${recipe.taskName? recipe.taskName() : ''}] isArray[${Array.isArray(recipe)}]`, recipe)
      if (Array.isArray(recipe)) {
        tasks.push(this.toTasks(recipe, []))
      }
      else {
        let taskName = this.toTask(recipe)
        tasks.push(taskName)
      }
    }

    return tasks
  }
}

/**
 *
 * @param recipes - (recipes or task fns, or task names)
 */
const series = (gulp, ...recipes) => {
  let series = gulp.series(new Recipes().toTasks(recipes))

  // hack to attach the recipes for inspection by aggregate
  series.recipes = recipes
  return series
}

/**
 *
 * @param recipes - (recipes or task fns, or task names)
 */
const parallel = (gulp, ...recipes) => {
   let parallel = gulp.parallel(new Recipes().toTasks(recipes))

  // hack to attach the recipes for inspection by aggregate
  parallel.recipes = recipes
  return parallel
}

export { Preset, Rails, EsLint, Uglify, Autoprefixer, Images, Sass, ScssLint, Aggregate, RollupEs, RollupCjs, RollupIife, RollupAmd, RollupUmd, Copy, CleanImages, CleanStylesheets, CleanJavascripts, CleanDigest, Clean, Rev, MinifyCss, Mocha, Prepublish, PublishBuild, Jekyll, series, parallel };
//# sourceMappingURL=gulp-pipeline.es.js.map