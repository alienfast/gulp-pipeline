import extend from 'extend';
import path from 'path';
import Util, { PluginError } from 'gulp-util';
import stringify from 'stringify-object';
import shelljs from 'shelljs';
import fs from 'fs-extra';
import fileSyncCmp from 'file-sync-cmp';
import process from 'process';
import iconv from 'iconv-lite';
import { Buffer } from 'buffer';
import findup from 'findup-sync';
import glob from 'glob';
import jsonfile from 'jsonfile';
import console from 'console';
import notify from 'gulp-notify';
import eslint from 'gulp-eslint';
import debug from 'gulp-debug';
import gulpif from 'gulp-if';
import uglify from 'gulp-uglify';
import sourcemaps from 'gulp-sourcemaps';
import concat from 'gulp-concat';
import extReplace from 'gulp-ext-replace';
import autoprefixer from 'gulp-autoprefixer';
import BrowserSync from 'browser-sync';
import changed from 'gulp-changed';
import imagemin from 'gulp-imagemin';
import merge from 'merge-stream';
import sass from 'gulp-sass';
import scssLint from 'gulp-scss-lint';
import scssLintStylish from 'gulp-scss-lint-stylish';
import unique from 'array-unique';
import { rollup as rollup$1 } from 'rollup';
import replace from 'rollup-plugin-replace';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import chalk from 'chalk';
import globAll from 'glob-all';
import del from 'del';
import rev from 'gulp-rev';
import revReplace from 'gulp-rev-replace';
import replace$1 from 'gulp-replace';
import cssnano from 'gulp-cssnano';
import mocha from 'gulp-mocha';
import mochaPhantomJS from 'gulp-mocha-phantomjs';
import { BuildControl, Npm } from 'build-control';
import pathIsAbsolute from 'path-is-absolute';
import tmp from 'tmp';
import DefaultRegistry from 'undertaker-registry';

const Default = {
  watch: true,
  debug: false,
  cwd: `${shelljs.pwd()}` // ensure a new string - not the string-like object which causes downstream errors on type === string
}

const Base = class {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(...configs) {
    this.config = extend(true, {}, Default, ...configs)
    // this.debugDump(`[${this.constructor.name}] using resolved config`, this.config)
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
    if (this.config.debug) {
      this.debug(`${msg}:\n${this.dump(obj)}`)
    }
  }

  dump(obj) {
    return stringify(obj)
  }

  notifyError(error, e) {
    this.log(error)
    throw e
  }

  /**
   * Wraps shellJs calls that act on the file structure to give better output and error handling
   * @param command
   * @param logResult - return output from the execution, defaults to true. If false, will return code instead
   * @param returnCode - defaults to false which will throw Error on error, true will return result code
   */
  exec(command, logResult = true) {
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
      return shellResult
    }
    else {
      this.notifyError(`Command failed \`${command}\`, cwd: ${options.cwd}: ${output}.`)
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
  constructor(config = {debug: false}) {
    super({encoding: "utf8"}, config)
  }

  findup(glob, options = {}, fullPath = true) {
    let f = findup(glob, options)
    if(this.config.debug) {
      this.debug(`findup-sync(${glob}, ${this.dump(options)}): ${this.dump(f)}`)
    }
    if (f && fullPath) {
      return path.resolve(f)
    }
    else {
      return f
    }
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
    let stat = fs.lstatSync(src)
    if (path.basename(src) !== path.basename(dest)) {
      return
    }

    if (stat.isFile() && !fileSyncCmp.equalFiles(src, dest)) {
      return
    }

    let fd = fs.openSync(dest, isWindows ? 'r+' : 'r')
    fs.futimesSync(fd, stat.atime, stat.mtime)
    fs.closeSync(fd)
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
      fs.writeFileSync(filepath, contents)

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
      contents = fs.readFileSync(String(filepath))
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
    this.debug(`mkdir ${dirpath}:`)
    // Set directory mode in a strict-mode-friendly way.
    if (mode == null) {
      mode = parseInt('0777', 8) & (~process.umask())
    }
    dirpath.split(pathSeparatorRe).reduce((parts, part) => {
      parts += part + '/'
      let subpath = path.resolve(parts)
      if (!this.exists(subpath)) {
        try {
          this.debug(`\tfs.mkdirSync(${subpath}, ${mode})`)
          fs.mkdirSync(subpath, mode)
        }
        catch (e) {
          this.notifyError(`Unable to create directory ${subpath} (Error code: ${e.code}).`, e)
        }
      }
      else {
        this.debug(`\t${subpath} already exists`)
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
    let result

    try {
      fs.statSync(filepath)
      result = true
    }
    catch (error) {
      result = false
    }

    this.debug(`exists(${filepath})? ${result}`)
    return result
  }

  isDir(...args) {
    let filepath = path.join(...args)
    return this.exists(filepath) && fs.statSync(filepath).isDirectory()
  }

  detectDestType(dest) {
    if (dest.endsWith('/')) {
      return 'directory'
    }
    else {
      return 'file'
    }
  }

  modified(sourceFileName, targetFileName) {
    let sourceStat = null
    let targetStat = null
    try {
      sourceStat = fs.statSync(sourceFileName)
      targetStat = fs.statSync(targetFileName)
    }
    catch (error) {
      return true    // one file doesn't exist
    }

    this.debug(`modified mtime comparison a) ${sourceFileName} vs. b) ${targetFileName}\n\ta) ${sourceStat.mtime}\n\tb) ${targetStat.mtime}`)
    if (sourceStat.mtime > targetStat.mtime) {
      return true
    }
    else {
      return false
    }
  }

  delete(filename, ignoreError = false) {
    try {
      fs.unlinkSync(filename)
    }
    catch (error) {
      if (!ignoreError) {
        throw error
      }
    }
  }
}


const File = class {
  static findup(glob, options = {}, fullPath = true) {
    return instance.findup(glob, options, fullPath)
  }

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

  static modified(sourceFileName, targetFileName) {
    return instance.modified(sourceFileName, targetFileName)
  }

  static delete(filename, ignoreError = false){
    return instance.delete(filename, ignoreError)
  }
}

//  singleton
let instance = new FileImplementation()

const Ruby = class {
  static localPath(name) {
    let filename = `${name}`

    // if using source dir
    let filepath = path.join(__dirname, filename) // eslint-disable-line no-undef
    if(!File.exists(filepath)){

      // if using dist dir, use the relative src/ruby path
      filepath = path.join(__dirname, '../src/ruby', filename) // eslint-disable-line no-undef
      if(!File.exists(filepath)) {
        throw new Error(`Expected to find ${filepath}`)
      }
    }

    return filepath
  }
}

const Files = {
  CACHE: `.gulp-pipeline-rails.json`,
  GEM_LOCK: `Gemfile.lock`
}
const Rails = class extends Base {
  constructor(config = {debug: false}) {
    // We need a rails app to run our rails script runner.
    //  Since this project could be a rails engine, find a rails app somewhere in or under the cwd.
    let entries = glob.sync('**/bin/rails', {realpath: true})
    if (!entries || entries.length <= 0) {
      throw new Error(`Unable to find Rails application directory based on existence of 'bin/rails'`)
    }

    if (entries.length > 1) {
      throw new Error(`railsAppCwd() should only find one rails application but found ${entries}`)
    }
    let cwd = path.join(entries[0], '../..')

    super({cwd: cwd}, config)
  }

  enumerateEngines() {
    let results = this.exec(`${Ruby.localPath('railsRunner.sh')} ${Ruby.localPath('enumerateEngines.rb')}`)

    // run via spring with zero results:
    //    status: 0,
    //    stdout: '{}\n',
    //    stderr: 'Running via Spring preloader in process 95498\n',
    return JSON.parse(results.stdout)
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
  baseDirectories() {
    if (!File.modified(Files.GEM_LOCK, Files.CACHE)) {
      this.log(`Gemfile.lock is unchanged, using baseDirectories cache.`)
      return jsonfile.readFileSync(Files.CACHE)
    }
    else {
      this.log(`Generating baseDirectories and rails engines cache...`)
      File.delete(Files.CACHE, true)

      let engines = this.enumerateEngines()
      console.log(this.dump(engines)) // eslint-disable-line no-console

      let baseDirectories = ['./']
      for (let key of Object.keys(engines)) {
        baseDirectories.push(engines[key])
      }

      this.log(`Writing baseDirectories cache...`)
      let result = {baseDirectories: baseDirectories}
      jsonfile.writeFileSync(Files.CACHE, result, {spaces: 2})
      return result
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
      options: {cwd: 'js'},
      all: '**/*' // include all files, may have yml, sh, json, in addition to js
    },
    test: {
      glob: '**/*.js',
      options: {cwd: 'test'}
    },
    watch: {
      glob: '**/*.js',
      options: {cwd: 'js'}
    },
    dest: 'dist'
  },
  stylesheets: {
    source: {
      glob: ['*.scss', '!_*.scss'],  // do not compile all files, only non-underscored files
      options: {cwd: 'scss'},
      all: '**/*.scss'
    },
    watch: {
      glob: '**/*.scss',
      options: {cwd: 'scss'}
    },
    dest: 'dist'
  },
  images: {
    source: {options: {cwd: 'images'}},
    watch: {options: {cwd: 'images'}},
    dest: 'dist'
  },
  postProcessor: {
    source: {options: {cwd: 'dist'}},
    watch: {options: {cwd: 'dist'}},
    dest: 'dist'
  }
}

const PresetNodeSrc = {
  javascripts: {
    source: { options: {cwd: 'src'}},
    watch: {options: {cwd: 'src'}}
  }
}

const PresetNodeLib = {
  javascripts: {
    source: { options: {cwd: 'lib'}},
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
  postProcessor: {
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
    return extend(true, {}, Baseline, PresetRails, new Rails().baseDirectories(), overrides)
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
    super(Default$3, ...configs)
    this.requireValue(gulp, 'gulp')
    this.gulp = gulp
  }

  taskName() {
    if (!this.config.task || !this.config.task.name) {
      return ''
    }

    //if (!this.config.task.name) {
    //  this.notifyError(`Expected ${this.constructor.name} to have a task name in the configuration.`)
    //}
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
    let isWatching = (this.gulp ? this.gulp.watching : undefined) || watching
    this.debug(`isWatching: ${isWatching}`)
    //this.debugDump('notifyError', error)

    let lineNumber = (error.lineNumber) ? `Line ${error.lineNumber} -- ` : ''
    let taskName = error.task || ((this.config.task && this.config.task.name) ? this.taskName() : this.constructor.name)

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

    // Prevent the 'watch' task from stopping
    if (isWatching) {
        // do nothing
      this.debug(`notifyError: watching, so not doing anything`)
    }
    else if (this.gulp) {
      // if this is not used, we see "Did you forget to signal async completion?", it also unfortunately logs more distracting information below.  But we need to exec the callback with an error to halt execution.
      this.donezo(done, error)
    }
    else {
      this.debug(`notifyError: throwing error`)
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
}

const Default$2 = {
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

    super(gulp,
      extend(true, {},  // extend presets here since BaseGulp doesn't use preset.
        Default$2,
        {baseDirectories: preset.baseDirectories},
        Preset.resolveConfig(preset, ...configs)
      )
    )

    // in case someone needs to inspect it later i.e. buildControl
    this.preset = preset
    this.registerTask()
    this.registerWatchTask()
  }

  registerWatchTask() {
    if (this.config.watch) {
      // generate watch task e.g. sass:watch
      let name = this.watchTaskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)
      this.watchFn = (done) => {
        this.log(`[${Util.colors.green(name)}] watching ${this.config.watch.glob} ${stringify(this.config.watch.options)}...`)

        return this.gulp.watch(this.config.watch.glob, this.config.watch.options, () => {
          this.log(`Watched file changed, running ${this.taskName()}...`);
          return Promise
            .resolve(this.run(done, true))
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
    // generate primary task e.g. sass

    // set a fn for use by the task, also used by aggregate/series/parallel
    let taskFn = (done) => {
      //this.log(`Running task: ${Util.colors.green(name)}`)

      if (this.config.debug) {
        this.debugDump(`Executing ${Util.colors.green(this.displayName())} with config`, this.config)
      }
      return this.run(done)
    }

    // metadata for convenience so that gulp tasks show up with this instead of 'anonymous'
    taskFn.displayName = this.displayName()

    // assign it last so that displayName() can resolve this first as others may set it externally like <clean>
    this.taskFn = taskFn

    if (this.shouldRegisterTask()) {

      // set the description
      if (this.createDescription !== undefined) {
        this.config.task.description = this.createDescription()
      }

      // set metadata on fn for discovery by gulp
      this.taskFn.description = this.config.task.description


      // register
      let name = this.taskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)
      this.gulp.task(name, this.taskFn)
    }
  }

  shouldRegisterTask() {
    return (this.config.task && this.config.task.name)
  }

  displayName() {
    if (this.taskFn !== undefined && this.taskFn.displayName) {
      return this.taskFn.displayName
    }
    else if (this.shouldRegisterTask()) {
      return this.taskName()
    }
    else {
      // metadata for convenience so that gulp tasks show up with this instead of 'anonymous'
      return `<${this.constructor.name}>`
    }
  }

  logFinish(message = 'finished.') {
    this.log(`[${Util.colors.green(this.taskName())}] ${message}`)
  }

  debugOptions() { // this controls the gulp-debug log statement, created to mirror our #debug's log format
    return {title: `[${Util.colors.cyan('debug')}][${Util.colors.cyan(this.constructor.name)}]`}
  }
}

const Default$1 = {
  debug: false,
  presetType: 'javascripts',
  task: {
    name: 'eslint'
  },
  source: {
    glob: '**/*.js'
  },
  options: {
    // Files were being ignored
    // ---------------------------
    //  With gulp-pipeline setup, we are specific enough with cwd that we don't need to use a blanket
    //  (default) .eslintignore file.  Turn off this behavior and lint anything we point at.
    //  @see http://eslint.org/docs/developer-guide/nodejs-api#cliengine
    warnFileIgnored: true,
    ignore: false
  }
}

const EsLint = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default$1, ...configs)
  }

  createDescription() {
    return `Lints ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {
    // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(eslint(this.config.options))
      .pipe(eslint.format()) // outputs the lint results to the console. Alternatively use eslint.formatEach() (see Docs).
      // primarily eslint.failAfterError() but we use notifyError to process the difference between watching and not so we don't end process.
      .pipe(eslint.results((results) => {
        let count = results.errorCount;
        if (count > 0) {
          let error =  new PluginError(
            'gulp-eslint',
            {
              name: 'ESLintError',
              message: 'Failed with ' + count + (count === 1 ? ' error' : ' errors')
            }
          )

          this.notifyError(error, done, watching)
        }
      }))
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
  presetType: 'postProcessor',
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
  },

  concat: {
    dest: undefined // if specified, will use concat to this dest filename, OTHERWISE, it will just assume one file and rename to .min.js
  }
}

/**
 * By default, assumes ONE source glob file match, OTHERWISE specify {concat: { dest: 'out.min.js' } }
 *
 */
const Uglify = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default$4, ...configs)
  }

  createDescription() {
    let msg = `Uglifies ${this.config.source.options.cwd}/${this.config.source.glob} to ${this.config.dest}`
    if (this.config.concat.dest) {
      msg += `/${this.config.concat.dest}`
    }
    return msg
  }

  run(done, watching = false) {

    // helpful log message if files not found
    let files = glob.sync(this.config.source.glob, this.config.source.options)
    if (!files || files.length <= 0) {
      this.log(`No sources found to uglify in: ${this.dump(this.config.source)}`)
    }

    if (this.config.concat.dest) {

      // run the concat scenario
      this.debug(`concat dest: ${this.config.dest}/${this.config.concat.dest}`)
      return this.gulp.src(this.config.source.glob, this.config.source.options)
        .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
        .pipe(concat(this.config.concat.dest))

        // identical to below
        .pipe(sourcemaps.init())
        .pipe(uglify(this.config.options))
        .on('error', (error) => {
          this.notifyError(error, done, watching)
        })
        .pipe(this.gulp.dest(this.config.dest))
    }
    else {

      // run the single file scenario
      this.debug('single file with no dest')

      if (files.length > 1) {
        throw new Error(`Should only find one file but found ${files.length} for source: ${this.dump(this.config.source)}.  Use the concat: {dest: 'output.min.js' } configuration for multiple files concatenated with uglify.  Files found: ${this.dump(files)}`)
      }

      return this.gulp.src(this.config.source.glob, this.config.source.options)
        .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
        .pipe(extReplace('.min.js', /.js$/))  // needs to be end-of-line regex so we don't messup paths with '.js' in the names.

        // identical to above
        .pipe(sourcemaps.init())
        .pipe(uglify(this.config.options))
        .on('error', (error) => {
          this.notifyError(error, done, watching)
        })
        .pipe(this.gulp.dest(this.config.dest))
    }
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
    super(gulp, preset, Default$5, ...configs)
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
    let options = extend(true, {}, this.config.source.options)
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

const node_modules = File.findup('node_modules')

const Default$6 = {
  debug: false,
  presetType: 'stylesheets',
  task: {
    name: 'sass'
  },
  options: {
    // NOTE: these are added in the constructor
    // WARNING: `includePaths` this should be a fully qualified path if overriding
    //  @see https://github.com/sass/node-sass/issues/1377
    //includePaths: [node_modules] // this will find any node_modules above the current working directory
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
    let includePaths = [node_modules]
    // add sub-node_module paths to the includePaths
    for (let subNodeModules of glob.sync('*/node_modules', {cwd: node_modules})) {
      let fullpath = path.join(node_modules, subNodeModules)
      includePaths.push(fullpath)
    }

    super(gulp, preset, Default$6, {options: {includePaths: includePaths}}, ...configs)
    this.browserSync = BrowserSync.create()
  }

  createDescription() {
    return `Compiles ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {
    // add debug for importing problems (can be very helpful)
    if (this.config.debug && this.config.options.importer === undefined) {
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
    super(gulp, preset, Default$7, ...configs)

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

    if (Array.isArray(recipes)) {
      this.notifyError(`recipes must not be an array, but a function, series, or parallel, found: ${recipes}`)
    }

    if (Aggregate.isAggregate(recipes)) {
      // it's another aggregate, so just use it's taskFn, but with a wrapper so we don't rename it.
      this.taskFn = (done) => recipes.taskFn(done)
    }
    else {
      // track recipes as taskFn so that aggregates can be included and resolved as part of other aggregates just like recipes
      this.taskFn = recipes
    }

    this.registerTask(this.taskName())

    if (this.config.watch) {
      this.registerWatchTask(this.watchTaskName())
    }
  }

  createHelpText() {
    //let taskNames = new Recipes().toTasks(this.taskFn)
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
    //let tasks = this.toTasks(this.taskFn)
    //this.debug(`Registering task: ${Util.colors.green(taskName)} for ${stringify(tasks)}`)
    this.gulp.task(taskName, this.taskFn)
    this.taskFn.displayName = taskName
    this.taskFn.description = this.createHelpText()
  }

  watchToGlobs(recipe) {
    // glob could be array
    let fullGlobs = []
    if (recipe.config.watch.glob === undefined) {
      return fullGlobs
    }
    let globs = recipe.config.watch.glob
    if (!Array.isArray(recipe.config.watch.glob)) {
      globs = [recipe.config.watch.glob]
    }

    for (let glob of globs) {
      fullGlobs.push(`${recipe.config.watch.options.cwd}/${glob}`)
    }
    return fullGlobs
  }

  registerWatchTask(watchTaskName) {
    let coloredTask = `${Util.colors.green(watchTaskName)}`
    // generate watch task
    if (this.watchableRecipes().length < 1) {
      this.debug(`No watchable recipes for task: ${coloredTask}`)
      return
    }

    this.debug(`Registering task: ${coloredTask}`)

    // https://github.com/alienfast/gulp-pipeline/issues/29
    // aggregate all globs into an array for a single watch fn call
    let globs = []
    for (let recipe of this.watchableRecipes()) {
      globs = globs.concat(this.watchToGlobs(recipe))
    }

    globs = unique(globs)
    this.debugDump('globs', globs)

    let watchFn = () => {
      this.log(`${coloredTask} watching ${globs.join(', ')}`)
      let watcher = this.gulp.watch(globs, {}, (done) => {

        // set this global so that BasGulp#notifyError can make sure not to exit if we are watching
        this.gulp.watching = true
        this.debug(`setting gulp.watching: ${this.gulp.watching}`)
        let result = this.taskFn(done)
        return result
      })

      // watcher.on('error', (error) => {
      //   this.notifyError(`${coloredTask} ${error}`)
      // })

      watcher.on('add', (path) => {
        this.log(`${coloredTask} ${path} was added, running...`)
      })

      watcher.on('change', (path) => {
        this.log(`${coloredTask} ${path} was changed, running...`)
      })
      watcher.on('unlink', (path) => {
        this.log(`${coloredTask} ${path} was deleted, running...`)
      })

      return watcher
    }

    watchFn.displayName = `<${watchTaskName}>`
    watchFn.description = this.createWatchHelpText()
    return this.gulp.task(watchTaskName, watchFn)
  }

  static isAggregate(current) {
    if (current.taskFn && current.taskFn.recipes) {
      return true
    }

    return false
  }

  flatten(list) {
    // parallel and series set `.recipes` on the function as metadata
    let callback = (prev, current) => {
      let item = current

      // Flatten any series/parallel
      if (typeof current === "function" && current.recipes) {
        this.debugDump(`flatten function recipes`, current.recipes)
        item = this.flatten(current.recipes)
      }
      // Flatten any Aggregate object - exposes a taskFn (which should be a series/parallel)
      else if (Aggregate.isAggregate(current)) {
        this.debugDump(`flatten ${current.constructor.name} with taskFn.recipes`, current.taskFn.recipes)
        item = this.flatten(current.taskFn.recipes)
      }
      //else {
      //  if (current.taskFn) {
      //    this.debugDump(`flatten something WITH taskFn`, current)
      //
      //    if(current.taskFn.recipes){
      //      this.debugDump(`flatten something WITH taskFn.recipes`, current.taskFn.recipes)
      //    }
      //  }
      //  else if (current.recipes) {
      //    this.debugDump(`flatten something WITH recipes but not a fn`, current)
      //  }
      //  else if (current && current.constructor) {
      //    this.debugDump(`flatten ${current.constructor.name} with no recipes`, current)
      //  }
      //  else if (Array.isArray(current)) {
      //    this.debugDump(`flatten array with no recipes`, current)
      //  }
      //  else {
      //    this.debugDump(`flatten ???`, current)
      //  }
      //}
      return prev.concat(item)
    }

    return list.reduce(callback, [])
  }

  flattenedRecipes() {
    let recipes = this.flatten([this.taskFn])
    this.debugDump(`flattenedRecipes`, recipes)
    return recipes
  }

  watchableRecipes() {
    // create an array of watchable recipes
    let watchableRecipes = []
    for (let recipe of this.flattenedRecipes()) {
      if ((typeof recipe !== "string") && (typeof recipe !== "function") && recipe.config.watch) {
        watchableRecipes.push(recipe)
      }
    }
    return watchableRecipes
  }
}

//import BrowserSync from 'browser-sync'
const node_modules$1 = File.findup('node_modules')


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

const NodeEnvReplace = {
  nodeEnvReplace: {
    enabled: false,
    options: {
      'process.env.NODE_ENV': JSON.stringify('production')
    }
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
      extensions: ['.js', '.json']
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

    super(gulp, preset, Default$9, NodeEnvReplace, NodeResolve, CommonJs, config)

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

    return rollup$1(options)
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

const Default$10 = {
  task: {
    name: 'rollup:cjs'
  },
  presetType: 'javascripts',
  babel: {
    babelrc: false,
    presets: ['es2015-rollup']
  },
  options: {
    //dest: '', // required
    format: 'cjs'
    //plugins: [babel({
    //  babelrc: false,
    //  presets: ['es2015-rollup']
    //})]
  },
  nodeEnvReplace: {
    enabled: false // building for react in the browser?
  },
  nodeResolve: {
    enabled: false // bundle a full package with dependencies?
  },
  commonjs: {
    enabled: false // convert dependencies to commonjs modules for rollup
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
    let config = Preset.resolveConfig(preset, Default$10, ...configs)
    super(gulp, preset, Default$10, {
        options: {
          plugins: [babel(config.babel)]
        }
      },
      ...configs)
  }
}

const Default$11 = {
  task: {
    name: 'rollup:cjs-bundled'
  },
  nodeResolve: {
    enabled: true // bundle a full package with dependencies? (if not use RollupCjs itself)
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
const RollupCjsBundled = class extends RollupCjs {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default$11, ...configs)
  }
}

const Default$12 = {
  task: {
    name: 'rollup:iife'
  },
  options: {
    //dest: '', // required
    format: 'iife'
  }
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const RollupIife = class extends RollupCjsBundled {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default$12, ...configs)
  }
}

const Default$13 = {
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
    super(gulp, preset, Default$13, ...configs)
  }
}

const Default$14 = {
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
    super(gulp, preset, Default$14, ...configs)
  }
}

const Default$15 = {
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
    glob: undefined,      // [] or string glob pattern, uses node-glob-all https://github.com/jpillora/node-glob-all#usage
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
    super(gulp, preset, Default$15, ...configs)

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
      fs.chmodSync(to, (this.config.mode === true) ? fs.lstatSync(from).mode : this.config.mode)
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

      // ensure pattern is an array
      if (!Array.isArray(pattern)) {
        pattern = [pattern]
      }

      // make a copy so that nothing processing will alter the config values
      pattern = pattern.slice()

      this.log(`Copying ${options.cwd}/${pattern}...`)
      //this.debugDump(`this config: `, this.config)

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

const Default$17 = {
  presetType: `macro`, // allows direct instantiation
  debug: false,
  task: false,
  watch: false,
  sync: true,  // necessary so that tasks can be run in a series, can be overriden for other purposes
  options: {}
}

const BaseClean = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    let config = Preset.resolveConfig(preset, Default$17, ...configs)
    let destGlob = {} // assume no glob - directory and contents will be deleted
    if(config.glob){
      destGlob = {dest: `${config.dest}/${config.glob}`}
    }
    super(gulp, preset, config, destGlob)
  }

  createDescription(){
    // use the config to generate the dynamic help
    return `Cleans ${this.config.dest}`
  }

  run(done, watching = false) {
    if (this.config.sync) {
      this.debug(`deleting ${this.config.dest}`)
      let paths = del.sync(this.config.dest, this.config.options)
      this.logDeleted(paths)
    }
    else {
      this.debug(`deleting ${this.config.dest}`)
      return del(this.config.dest, this.config.options)
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

const Default$16 = {
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
    super(gulp, preset, Default$16, ...configs)
  }
}

const Default$18 = {
  presetType: 'stylesheets',
  task: {
    name: 'clean:stylesheets'
  },
  glob: '**/*.css'
}

const CleanStylesheets = class extends BaseClean {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default$18, ...configs)
  }
}

const Default$19 = {
  presetType: 'javascripts',
  task: {
    name: 'clean:javascripts'
  },
  glob: '**/*.js'
}

const CleanJavascripts = class extends BaseClean {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default$19, ...configs)
  }
}

const Default$20 = {
  presetType: 'postProcessor',
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
    super(gulp, preset, Default$20, ...configs)
  }
}

const Recipes = class extends Base {

  constructor(config = {debug: false}) {
    super(config)
  }

  /**
   * Prefer to return the taskFn instead of a string, but return the string if that's all that is given to us.
   *
   * @param recipeOrAggregateOrString
   * @returns {*}
   */
  toTask(recipeOrAggregateOrString) {
    let task = null
    if (typeof recipeOrAggregateOrString === "string") {
      // any given task name should be returned as-is
      task = recipeOrAggregateOrString
      this.debug(`toTask(): ${task}`)
    }
    else {
      if (recipeOrAggregateOrString.taskFn) {
        // recipes and aggregates expose a taskFn
        task = recipeOrAggregateOrString.taskFn
      }
      else if (typeof recipeOrAggregateOrString === "function") {
        // any given fn should be return as-is i.e. series/parallel
        task = recipeOrAggregateOrString
      }

      this.debug(`toTask(): ${task.name || task.displayName}`)
    }
    return task
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
const parallel = (gulp, ...recipes) => {
   let parallel = gulp.parallel(new Recipes().toTasks(recipes))

  // hack to attach the recipes for inspection by aggregate
  parallel.recipes = recipes
  return parallel
}
parallel.displayName = `<parallel>`

const Default$21 = {
  debug: false,
  watch: false,
  presetType: 'macro',
  task: {
    name: 'clean',
    description: 'Cleans images, stylesheets, and javascripts.'
  }
}

const Clean = class extends Aggregate {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, ...configs) {
    let config = Preset.resolveConfig(preset, Default$21, ...configs)
    let recipes = parallel(gulp,
      new CleanImages(gulp, preset, ...configs),
      new CleanStylesheets(gulp, preset, ...configs),
      new CleanJavascripts(gulp, preset, ...configs),
      new CleanDigest(gulp, preset, ...configs)
    )

    super(gulp, config.task.name, recipes, config)
  }
}

/**
 * Simplified clean() that uses the BaseClean recipe
 */
const clean = (gulp, name, options = {}) => {
  let c = new BaseClean(gulp, {}, {dest: name, options: {force: true}}, options)
  // set the display name so it shows up in the task list
  c.taskFn.displayName = `<clean>`
  return c
}

const Default$22 = {
  debug: false,
  presetType: 'postProcessor',
  task: {
    name: 'rev'
  },
  watch: {
    glob: '**',
    options: {
      //cwd: ** resolved from preset **
      ignore: ['**/digest', '**/digest/**', '**/*.map']
    }
  },
  source: {
    glob: '**',
    options: {
      //cwd: ** resolved from preset **
      ignore: ['**/digest', '**/digest/**', '**/*.map']
    }
  },
  options: {
    merge: true,
    path: 'rev-manifest.json'
  }
}

const Rev = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default$22, ...configs)
    this.browserSync = BrowserSync.create()
  }

  createDescription() {
    return `Adds revision digest to assets from ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {
    this.debugDump(`gulp.src ${this.config.source.glob}`, this.config.source.options)


    // base is not working    https://github.com/sindresorhus/gulp-rev/issues/150
    //let manifestOptions = extend(true, {}, {base: this.config.dest}, this.config.options)

    // workaround
    let manifestOptions = extend(true, {},
      this.config.options,
      {
        base: this.config.dest,
        path: `${this.config.dest}/${this.config.options.path}`
      }
    )

    this.debugDump(`manifestOptions`, manifestOptions)

    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(rev(this.config.options))
      .pipe(this.gulp.dest(this.config.dest))

      // Merge with an existing unless merge == false
      .pipe(rev.manifest(manifestOptions))
      .pipe(this.gulp.dest(this.config.dest))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })
      .pipe(this.browserSync.stream())
  }
}

const Default$23 = {
  debug: false,
  presetType: 'postProcessor',
  task: {
    name: 'rev:replace'
  },
  watch: false,
  source: { // cwd/ignore defaulted from preset set in constructor
    glob: '**'
  },
  manifest: 'rev-manifest.json', // file name only
  options: {}
}

const RevReplace = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    let resolvedPreset = Preset.resolveConfig(preset, Default$23, ...configs)
    super(gulp, preset,
      Default$23,
      {
        source: {
          options: { // replace everything in the postProcessor dest folder (except manifest)
            cwd: resolvedPreset.dest,
            ignore: [`**/${resolvedPreset.manifest}`]
          }
        }
      },
      ...configs)
  }

  createDescription() {
    return `Adds revision digest to assets from ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {

    this.debugDump(`gulp.src ${this.config.source.glob}`, this.config.source.options)

    // options.manifest has to originate from gulp.src
    let options = extend(true, {},
      {
        // full path to the manifest file
        manifest: this.gulp.src(`${this.config.dest}/${this.config.manifest}`)
      },
      this.config.options
    )

    this.debugDump(`revReplace options`, options)

    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(revReplace(options))
      .pipe(this.gulp.dest(this.config.dest))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })
  }
}

const Default$24 = {
  debug: false,
  minExtension: true, // replace extension .css with .min.css
  presetType: 'postProcessor',
  task: {
    name: 'css:nano'
  },
  watch: false, // typical use has this at the end of a pipeline, allowing watch here can cause infinite loops on aggregates
  //watch: {
  //  glob: ['**/*.css'],
  //  options: {
  //    //cwd: ** resolved from preset **
  //  }
  //},
  source: {
    glob: ['**/*.css', '!**/*.min.css'],
    options: {
      //cwd: ** resolved from preset **
    }
  },
  options: {
    //autoprefixer: false // assume this is done with Sass recipe
    // sourcemap: false
  }
}

/**
 * Recipe to be run after Rev or any other that places final assets in the digest destination directory
 */
const CssNano = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default$24, ...configs)
    this.browserSync = BrowserSync.create()
  }

  createDescription() {
    return `Minifies digest css from ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {

    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(gulpif(this.config.minExtension, extReplace('.min.css')))
      // whack the sourcemap otherwise it gives us "Unsupported source map encoding charset=utf8;base64"
      // ...we don't want it in the min file anyway
      .pipe(replace$1(/\/\*# sourceMappingURL=.*\*\//g, ''))
      .pipe(cssnano(this.config.options))
      .pipe(this.gulp.dest(this.config.dest))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })
      .pipe(this.browserSync.stream())
  }
}

const Default$26 = {
  debug: false,
  presetType: 'javascripts'
}

const BaseMocha = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    // resolve watch cwd based on test cwd
    super(gulp, preset,
      Default$26,
      {watch: {options: {cwd: Preset.resolveConfig(preset, Default$26, ...configs).test.options.cwd}}},
      ...configs)
  }

  createDescription() {
    return `Tests ${this.config.test.options.cwd}/${this.config.test.glob}`
  }
}

const Default$25 = {
  task: {
    name: 'mocha'
  },
  options: {
    reporter: 'nyan'
  }
}

const Mocha = class extends BaseMocha {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default$25, ...configs)
  }

  run(done, watching = false) {
    let bundle = this.gulp.src(this.config.test.glob, this.config.test.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(mocha(this.config.options)) // gulp-mocha needs filepaths so you can't have any plugins before it
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })

    return bundle
  }
}

const Default$27 = {
  test: {
    glob: 'testrunner.html'
  },
  task: {
    name: 'mocha:phantomjs'
  },
  options: {
    reporter: 'nyan'
  }
}

/*
WARNING: Using this means using a browser, and if your tests are written in ES2015 you need to use rollup first!
*/
const MochaPhantomJs = class extends BaseMocha {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default$27, ...configs)
  }

  run(done, watching = false) {
    let bundle = this.gulp.src(this.config.test.glob, this.config.test.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(mochaPhantomJS(this.config.options))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })

    return bundle
  }
}

/**
 *  This is the base for publish recipes using BuildControl
 */
const Default$29 = {

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
    super(gulp, preset, Default$29, ...configs)

    // use the dir as the cwd to the BuildControl class
    this.config.options = extend(true, {debug: this.config.debug, cwd: this.config.dir}, this.config.options)
  }
}

const Default$28 = {
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
    super(gulp, preset, Default$28, ...configs)
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
 *
 *  Travis-CI note: add the following:
 *
 *   # remove the dist branch and dist tags from travis builds
 *   branches:
 *    except:
 *       - dist
 *       - /^v(\d+\.)?(\d+\.)?(\*|\d+)$/
 *
 */
const Default$30 = {
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
    name: 'publish:build',
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
    super(gulp, preset, Default$30, ...configs)
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
      if (fs.existsSync(readme)) {
        this.log(`Found readme at ${readme}.  Will not generate a new one from the template.  Turn this message off with { readme: {enabled: false} }`)
      }
      else {
        fs.writeFileSync(readme, buildControl.interpolate(this.config.readme.template))
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
    for (let type of this.config.source.types) {  // defaulted in BasePublish
      let typePreset = this.preset[type]

      this.log(`Copying ${typePreset.source.options.cwd}/${typePreset.source.all}...`)
      for (let name of glob.sync(typePreset.source.all, typePreset.source.options)) {
        let from = path.join(typePreset.source.options.cwd, name)
        let to = path.join(buildDir, from)
        this.log(`\t...to ${to}`)
        fs.copySync(from, to)
      }
    }

    // copy any additional configured files
    for (let fileGlob of this.config.source.files) { // defaulted in BasePublish

      this.log(`Copying ${fileGlob}...`)
      for (let fromFullPath of glob.sync(fileGlob, {realpath: true})) {
        let from = path.relative(process.cwd(), fromFullPath)
        let to = path.join(buildDir, from)
        this.log(`\t...to ${to}`)
        fs.copySync(from, to)
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

const Default$31 = {
  task: {
    name: 'publish:npm',
    description: 'Publishes package on npm'
  },
  options: {}
}

/**
 *  This recipe will run execute `npm publish` with no other checks.
 *
 *  @see also PublishBuild - it will bump, publish build, and publish npm (all in one)
 */
const PublishNpm = class extends BasePublish {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default$31, ...configs)
  }

  run(done) {
    let npm = new Npm(this.config.options)
    npm.publish()
    this.donezo(done)
  }
}

/**
 *  This recipe will keep your source branch clean but allow you to easily push your
 *  _gh_pages files to the gh-pages branch.
 */
const Default$32 = {
  //debug: true,
  task: {
    name: 'publish:gh-pages',
    description: 'Publishes a _gh_pages directory to gh-pages branch'
  },
  options: {
    cwd: '_gh_pages',
    branch: 'gh-pages',
    tag: false, // no tagging on gh-pages push
    clean: { // no cleaning of cwd, it is built externally
      before: false,
      after: true  // we create a git repo, and without cleaning, subsequent runs will fail with "uncommitted changes"
    }
  }
}

const PublishGhPages = class extends BasePublish {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default$32, ...configs)
  }

  run(done) {
    let buildControl = new BuildControl(this.config.options)

    // run the commit/tagging/pushing
    buildControl.run()

    done()
  }
}

const Default$33 = {
  watch: false,
  presetType: 'macro',
  task: {
    name: 'jekyll',
    description: 'Builds a jekyll site'
  },
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
    super(gulp, preset, Default$33, ...configs)
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
      fs.writeFileSync(tmpFile.name, this.config.options.raw)

      // return the file path
      return tmpFile.name
    }
    else {
      return null
    }
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
series.displayName = `<series>`

/**
 *
 */
const tmpDir = (options = {prefix: 'gulp-pipeline_'}) => {
  let tmpDirObj = tmp.dirSync(options)

  tmpDirObj.removeCallback.displayName = '<tmpDir cleanup>'

  return tmpDirObj
}

/**
 *
 */
const tmpDirName = (options = {prefix: 'gulp-pipeline_'}) => {
  return tmpDir(options).name
}

const Default$34 = {
  debug: false,
  watch: false,
  presetType: 'macro',
  task: false
}

/**
 * Sleep the given ms value, for those quirky cases like when you need the filesystem to catch up.
 */
const Sleep = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, sleep, ...configs) {
    super(gulp, preset, Default$34, {sleep: sleep}, ...configs)
  }

  createDescription(){
    return `Sleeps for ${this.config.sleep} milliseconds.`
  }

  run(done) {
    setTimeout(() => { // eslint-disable-line no-undef
      this.donezo(done)
    }, this.config.sleep)
  }
}

/**
 * Simplified sleep() that uses the Sleep recipe
 */
const sleep = (gulp, ms) => {
  let c = new Sleep(gulp, {}, ms)
  // set the display name so it shows up in the task list
  c.taskFn.displayName = `<sleep>`
  return c
}

const Default$36 = {
  debug: false,
  // preset: -- mixed in at runtime in the constructor to avoid issues in non-rails projects
  global: {debug: false} // mixed into every config i.e debug: true
}

const BaseRegistry = class extends DefaultRegistry {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(...configs) {
    super()
    this.config = extend(true, {}, Default$36, ...configs)
    this.debugDump(`[${this.constructor.name}] using resolved config:`, this.config)
  }

  // ----------------------------------------------
  // protected

  /**
   * Class-based configuration overrides.  Shortcut to #keyConfig with class name lookup.
   */
  classConfig(clazz) {
    const className = clazz.prototype.constructor.name
    return this.keyConfig(className)
  }

  /**
   * config key-based configuration overrides:
   *  - these may be a single config hash or array of config hashes (last hash overrides earlier hashes)
   *  - in some cases, passing false for the class name may be implemented as omitting the registration of the recipe (see implementation of #init for details)
   *
   *  @return -  array - one or more configs as an array, so usage below in init is a universal spread/splat
   */
  keyConfig(key) {
    this.debug(`Resolving config for: ${key}...`)
    let config = this.config[key]

    this.debugDump(`config`, config)
    if (config === undefined) {
      config = [{}]
    }

    if (!Array.isArray(config)) {
      config = [config]
    }

    // add global at the begining of the array
    config.unshift(this.config.global)

    return config
  }

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
    this.debug(`${msg}:\n${this.dump(obj)}`)
  }

  dump(obj) {
    return stringify(obj)
  }

  notifyError(error, e) {
    this.log(error)
    throw e
  }
}

// per class name defaults that can be overridden
const Default$35 = {
  // Class-based configuration overrides:
  //  - these may be a single config hash or array of config hashes (last hash overrides earlier hashes)
  //  - in some cases, passing false for the class name may be implemented as omitting the registration of the recipe (see implementation of #init for details)
  RollupIife: true, // absent any overrides, build iife
  RollupCjs: false,
  RollupCjsBundled: false,
  RollupAmd: false,
  RollupUmd: false
}

/**
 * gulp.registry(new RailsRegistry(...configs))
 */
const RailsRegistry = class extends BaseRegistry {

  /**
   * @param config - customized overrides of the Default, last one wins
   */
  constructor(...configs) {
    super(Default$35, {preset: Preset.rails()}, ...configs)
  }

  init(gulp) {
    let preset = this.config.preset

    const js = new Aggregate(gulp, 'js',
      series(gulp,
        this.esLinters(gulp),
        this.rollups(gulp)
      ),
      ...this.keyConfig('js')
    )

    const css = new Aggregate(gulp, 'css',
      series(gulp,
        this.scssLinters(gulp),
        new Sass(gulp, preset, ...this.classConfig(Sass))
      ),
      ...this.keyConfig('css')
    )

    const defaultRecipes = new Aggregate(gulp, 'default',
      series(gulp,
        new Clean(gulp, preset),
        parallel(gulp,
          new Images(gulp, preset, ...this.classConfig(Images)),
          js,
          css
        )
      ),
      ...this.keyConfig('default')
    )

    // Create the production assets
    const tmpDirObj = tmpDir()
    const minifiedAssetsDir = tmpDirObj.name
    this.debug(`tmpDir for minified assets: ${minifiedAssetsDir}`)


    // digests need to be one task, tmpDir makes things interdependent
    const digests = {task: false, watch: false}

    const digest = new Aggregate(gulp, 'digest',
      series(gulp,
        new CleanDigest(gulp, preset, digests),

        // minify application.(css|js) to a tmp directory
        parallel(gulp,
          new Uglify(gulp, preset, digests, {dest: minifiedAssetsDir, concat: {dest: 'application.js'}}, ...this.classConfig(Uglify)),
          new CssNano(gulp, preset, digests, {dest: minifiedAssetsDir, minExtension: false}, ...this.classConfig(CssNano))
        ),

        // rev minified css|js from tmp
        new Rev(gulp, preset, digests, {
          source: {
            options: {
              cwd: minifiedAssetsDir
            }
          }
        }),
        // rev all the rest from the debug dir (except the minified application(css|js)) and merge with the previous rev
        new Rev(gulp, preset, digests, {
          source: {
            options: {
              ignore: ['**/application.js', '**/*.js.map', '**/application.css']
            }
          }
        }),

        // rewrite all revised urls in the assets i.e. css, js
        new RevReplace(gulp, preset, digests),

        // cleanup the temp files and folders
        clean(gulp, `${minifiedAssetsDir}/**`)
      ),
      ...this.keyConfig('digest')
    )

    // default then digest
    new Aggregate(gulp, 'all',
      series(gulp,
        defaultRecipes,
        digest
      ),
      ...this.keyConfig('all')
    )
  }

  esLinters(gulp) {
    return new EsLint(gulp, this.config.preset, ...this.classConfig(EsLint))
  }

  scssLinters(gulp){
    return new ScssLint(gulp, this.config.preset, ...this.classConfig(ScssLint))
  }

  rollups(gulp) {
    let preset = this.config.preset
    // javascripts may have two different needs, one standard iife, and one cjs for rails engines
    let rollups = []

    // All rails apps need the iife which is ultimately the application.js.
    //  Some rails engines may want it only for the purpose of ensuring that libraries can be included properly otherwise the build breaks (a good thing)
    if (this.config.RollupIife) {
      rollups.push(
        new RollupIife(gulp, preset, {
          options: {
            dest: 'application.js',
            moduleName: 'App'
          }
        }, ...this.classConfig(RollupIife))
      )
    }

    // Rails apps probably don't need commonjs, so by default it is off.
    //  Rails engines DO need commonjs, it is consumed by the rails app like any other node library.
    if (this.config.RollupCjs) {
      rollups.push(
        new RollupCjs(gulp, preset, {
          options: {
            dest: 'application.cjs.js',
            moduleName: 'App'
          }
        }, ...this.classConfig(RollupCjs))
      )
    }

    if (this.config.RollupCjsBundled) {
      rollups.push(
        new RollupCjsBundled(gulp, preset, {
          options: {
            dest: 'application.cjs-bundled.js',
            moduleName: 'App'
          }
        }, ...this.classConfig(RollupCjsBundled))
      )
    }

    if (this.config.RollupUmd) {
      rollups.push(
        new RollupUmd(gulp, preset, {
          options: {
            dest: 'application.umd.js',
            moduleName: 'App'
          }
        }, ...this.classConfig(RollupUmd))
      )
    }

    if (this.config.RollupAmd) {
      rollups.push(
        new RollupAmd(gulp, preset, {
          options: {
            dest: 'application.amd.js',
            moduleName: 'App'
          }
        }, ...this.classConfig(RollupAmd))
      )
    }

    return parallel(gulp,
      ...rollups
    )
  }
}

const Default$37 = {}

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
    super(Default$37, ...configs)
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

export { Preset, Rails, EsLint, Uglify, Autoprefixer, Images, Sass, ScssLint, Aggregate, RollupEs, RollupCjs, RollupCjsBundled, RollupIife, RollupAmd, RollupUmd, Copy, CleanImages, CleanStylesheets, CleanJavascripts, CleanDigest, Clean, clean, Rev, RevReplace, CssNano, Mocha, MochaPhantomJs, Prepublish, PublishBuild, PublishNpm, PublishGhPages, Jekyll, File, series, parallel, tmpDirName, tmpDir, Sleep, sleep, RailsRegistry, RailsEngineDummyRegistry };
//# sourceMappingURL=gulp-pipeline.es.js.map