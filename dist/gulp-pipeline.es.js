import extend from 'extend';
import path from 'path';
import glob from 'glob';
import spawn from 'cross-spawn';
import fs from 'fs';
import jsonfile from 'jsonfile';
import Util from 'gulp-util';
import stringify from 'stringify-object';
import notify from 'gulp-notify';
import gulpHelp from 'gulp-help';
import console from 'console';
import autoprefixer from 'gulp-autoprefixer';
import gulpif from 'gulp-if';
import debug from 'gulp-debug';
import eslint from 'gulp-eslint';
import BrowserSync from 'browser-sync';
import changed from 'gulp-changed';
import imagemin from 'gulp-imagemin';
import merge from 'merge-stream';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import findup from 'findup-sync';
import scssLint from 'gulp-scss-lint';
import scssLintStylish from 'gulp-scss-lint-stylish';
import { rollup } from 'rollup';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import process from 'process';
import babel from 'rollup-plugin-babel';
import del from 'del';
import rev from 'gulp-rev';
import cssnano from 'gulp-cssnano';
import mocha from 'gulp-mocha';
import BuildControl from 'build-control/src/buildControl';
import fs$1 from 'fs-extra';
import pathIsAbsolute from 'path-is-absolute';

const BaseDirectoriesCache = `.gulp-pipeline-rails.json`
const GemfileLock = `Gemfile.lock`

const Rails = class {
  static enumerateEngines() {

    let results = spawn.sync(this.localPath('railsRunner.sh'), [this.localPath('enumerateEngines.rb')], {
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

  static localPath(name) {
    let filename = `rails/${name}`

    // if using source dir
    let filepath = filepath = path.join(__dirname, filename) // eslint-disable-line no-undef
    try {
      fs.statSync(filepath)
    }
    catch (error) {
      // if using dist dir
      filepath = path.join(__dirname, '../src', filename) // eslint-disable-line no-undef
      fs.statSync(filepath)
    }

    return filepath
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
    source: {
      options: {cwd: 'lib'}
    },
    watch: {options: {cwd: 'lib'}}
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

const Default$1 = {
  watch: true,
  debug: false
}

const Base = class {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, config) {
    this.gulp = gulpHelp(gulp, {afterPrintCallback: () => console.log(`For configuration help see https://github.com/alienfast/gulp-pipeline \n`)}) // eslint-disable-line no-console
    this.config = extend(true, {}, Default$1, config)
    this.debug(`[${this.constructor.name}] using resolved config: ${stringify(this.config)}`)
  }

  // ----------------------------------------------
  // protected
  log(msg) {
    Util.log(msg)
  }

  debug(msg) {
    if (this.config.debug) {
      this.log(`[${Util.colors.cyan('debug')}][${Util.colors.cyan(this.constructor.name)}] ${msg}`)
    }
  }

  debugDump(msg, obj){
    this.debug(`${msg}:\n${stringify(obj)}`)
  }

  notifyError(error, watching = false) {
    let lineNumber = (error.lineNumber) ? `Line ${error.lineNumber} -- ` : ''
    let taskName = error.task || this.taskName()

    notify({
      title: `Task [${taskName}] Failed in [${error.plugin}]`,
      message: `${lineNumber}See console.`,
      sound: 'Sosumi' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
    }).write(error)

    let tag = Util.colors.black.bgRed
    let report = `

${tag('    Task:')} [${Util.colors.cyan(taskName)}]
${tag('  Plugin:')} [${error.plugin}]
${tag('   Error:')}
${error.message}`

    if (error.lineNumber) {
      report += `${tag('    Line:')} ${error.lineNumber}\n`
    }
    if (error.fileName)   {
      report += `${tag('    File:')} ${error.fileName}\n`
    }
    this.log(report)

    // Prevent the 'watch' task from stopping
    if(!watching) {
      this.gulp.emit('end')
    }
  }

  debugOptions() {
    return {title: `[${Util.colors.cyan('debug')}][${Util.colors.cyan(this.taskName())}]`}
  }
}

const Default = {
  watch: true,
  debug: false,
  task: {
    help: ''
  }
}

const BaseRecipe = class extends Base {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config) {

    super(gulp, extend(true, {},
      Default,
      {baseDirectories: preset.baseDirectories},
      Preset.resolveConfig(preset, config)))

    // in case someone needs to inspect it later i.e. buildControl
    this.preset = preset

    if (this.createHelpText !== undefined) {
      this.config.task.help = this.createHelpText()
    }
    this.registerTask()
    this.registerWatchTask()
  }


  //createHelpText(){
  //  // empty implementation that can dynamically create help text instead of the static config.task.help
  //}

  registerWatchTask() {
    if (this.config.watch) {
      // generate watch task e.g. sass:watch
      let name = this.watchTaskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)
      this.gulp.task(name, this.createWatchHelpText(), () => {
        this.log(`[${Util.colors.green(name)}] watching ${this.config.watch.glob} ${stringify(this.config.watch.options)}...`)

        return this.gulp.watch(this.config.watch.glob, this.config.watch.options, (event) => {
          this.log(`File ${event.path} was ${event.type}, running ${this.taskName()}...`);
          return Promise
            .resolve(this.run(true))
            .then(() => this.logFinish())
        })
      })
    }
  }

  createWatchHelpText() {
    return Util.colors.grey(`|___ watches ${this.config.watch.options.cwd}/${this.config.watch.glob}`)
  }


  registerTask() {
    if (this.config.task) {
      // generate primary task e.g. sass
      let name = this.taskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)
      this.gulp.task(name, this.config.task.help, () => {
        //this.log(`Running task: ${Util.colors.green(name)}`)

        if (this.config.debug) {
          this.debugDump(`Executing ${Util.colors.green(name)} with options:`, this.config.options)
        }
        return this.run()
      })
    }
  }

  taskName() {
    return this.config.task.name || this.constructor.name // guarantee something is present for error messages
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, AutoprefixerDefault, config))
  }

  run(watching = false) {
    // FIXME: is this right or wrong?  this class initially was extracted for reuse of Default options
    return this.gulp.src(this.config.source)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(autoprefixer(this.config.options))
      .on('error', (error) => {
        this.notifyError(error, watching)
      })
      .pipe(this.gulp.dest(this.config.dest))
  }
}

const Default$2 = {
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$2, config))
  }

  createHelpText(){
    return `Lints ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(watching = false) {
    // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
    let bundle = this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(eslint(this.config.options))
      .pipe(eslint.format()) // outputs the lint results to the console. Alternatively use eslint.formatEach() (see Docs).


      //1. HACK solution that works with first error, but is very ugly
      // this should emit the error, but we aren't notified
      .pipe(gulpif(!watching, eslint.failAfterError())) // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.

      // make sure we are notified of any error (this really should be happening in eslint.failAfterError(), but not sure where it is lost)
      .pipe(eslint.result((results) => { // this is single file #result not #results, we don't get notified on #results
        let count = results.errorCount;
        if (count > 0) {
          throw new Util.PluginError(
            'gulp-eslint',
            {
              message: 'Failed with' + (count === 1 ? ' error' : ' errors')
            }
          )
        }
      }))
      .on('error', (error) => {
        this.notifyError(error, watching)
      })

      // 2. Attempt now that returns are in place with the gulpif
      // this should emit the error, but we aren't notified
      //.pipe(gulpif(!watching, eslint.failAfterError())) // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.
      //.on('error', (error) => {
      //  this.notifyError(error, watching)
      //})

      //// 3. Attempt now that returns are in place WITHOUT gulpif
      //// this should emit the error, but we aren't notified
      //.pipe( eslint.failAfterError()) // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.
      //.on('error', (error) => {
      //  this.notifyError(error, watching)
      //})

      // 4. https://github.com/adametry/gulp-eslint/issues/135#issuecomment-180555978
      //.pipe(eslint.results(function (results) {
      //  var count = results.errorCount;
      //  console.log('Total ESLint Error Count: ' + count);
      //  if (count > 0) {
      //    throw new Error('Failed with Errors');
      //  }
      //}))
      //.on('error', function (error) {
      //  console.log('Total ESLint Error Count: ' + error);
      //})
      //.on('finish', function () {
      //  console.log('eslint.results finished');
      //})
      //.on('end', function () {
      //  console.log('eslint.results ended');
      //})

      //// 5. notification is emitted
      //.pipe(eslint.results(function (results) {
      //  var count = results.errorCount;
      //  console.log('*****Error Count: ' + count);
      //  if (count > 0) {
      //    throw new Error('******My custom error');
      //  }
      //}))
      //.on('error', (error) => {
      //  this.notifyError(error, watching)
      //})


      //// 6. notification is emitted
      //.pipe(eslint.results(function (results) {
      //  var count = results.errorCount;
      //  console.log('*****Error Count: ' + count);
      //  if (count > 0) {
      //    throw new PluginError('******My custom error');
      //  }
      //}))
      //.on('error', (error) => {
      //  this.notifyError(error, watching)
      //})

      //// 7. notification is emitted, except when watching
      //.pipe(eslint.results(function (results) {
      //  let count = results.errorCount;
      //  console.error('****************in results handler')
      //  if (count > 0) {
      //    throw new PluginError('gulp-eslint', { message: 'Failed with ' + count + (count === 1 ? ' error' : ' errors') })
      //  }
      //}))
      //.on('error', (error) => {
      //  console.error('****************in error handler')
      //  this.notifyError(error, watching)
      //})


      //.pipe( eslint.failAfterError())
      //.on('error', (error) => {
      //  this.notifyError(error, watching)
      //})



    // FIXME: even including any remnant of JSCS at this point broke everything through the unfound requirement of babel 5.x through babel-jscs.  I can't tell where this occurred, but omitting gulp-jscs for now gets me past this issue.  Revisit this when there are clear updates to use babel 6
    //.pipe(jscs())      // enforce style guide
    //.pipe(stylish())  // log style errors
    //.pipe(jscs.reporter('fail')) // fail on error

    return bundle
  }
}

const Default$3 = {
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$3, config))
    this.browserSync = BrowserSync.create()
  }

  createHelpText() {
    return `Minifies change images from ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(watching = false) {

    var tasks = this.config.baseDirectories.map((baseDirectory) => {
      // join the base dir with the relative cwd
      return this.runOne(path.join(baseDirectory, this.config.source.options.cwd), watching)
    })
    return merge(tasks);
  }

  runOne(cwd, watching) {

    // setup a run with a single cwd a.k.a base directory FIXME: perhaps this could be in the base recipe? or not?
    let options = extend({}, this.config.source.options)
    options.cwd = cwd
    this.debug(`src: ${cwd}/${this.config.source.glob}`)

    return this.gulp.src(this.config.source.glob, options)
      .pipe(changed(this.config.dest)) // ignore unchanged files
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(imagemin(this.config.options))
      .on('error', (error) => {
        this.notifyError(error, watching)
      })
      .pipe(this.gulp.dest(this.config.dest))
      .pipe(this.browserSync.stream())
  }
}

const node_modules = findup('node_modules')

const Default$4 = {
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$4, config))
    this.browserSync = BrowserSync.create()
  }

  createHelpText() {
    return `Compiles ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(watching = false) {
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
        this.notifyError(error, watching)
      })
      .pipe(autoprefixer(this.config.autoprefixer.options))
      .pipe(sourcemaps.write())
      .pipe(this.gulp.dest(this.config.dest))
      .pipe(this.browserSync.stream())
  }
}

const Default$5 = {
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$5, config))
  }

  createHelpText(){
    return `Lints ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(watching = false) {
    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(scssLint(this.config.options))
      .on('error', (error) => {
        this.notifyError(error, watching)
      })
  }
}

const Default$6 = {
  debug: false,
  watch: true  // register a watch task that aggregates all watches and runs the full sequence
}

const TaskSeries = class extends Base {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, taskName, recipes, config = {}) {
    super(gulp, extend(true, {}, Default$6, config))
    this.recipes = recipes
    this.registerTask(taskName, recipes)

    if (this.config.watch) {
      this.registerWatchTask(`${taskName}:watch`, recipes)
    }
  }

  createHelpText() {
    let taskNames = this.flattenedRecipes().reduce((a, b) => {
      return a.concat(b.taskName());
    }, [])

    // use the config to generate the dynamic help
    return `Runs series [${taskNames.join(', ')}]`
  }

  createWatchHelpText() {
    let taskNames = this.watchableRecipes().reduce((a, b) => {
      return a.concat(b.taskName());
    }, [])

    return Util.colors.grey(`|___ aggregates watches from [${taskNames.join(', ')}] and runs full series`)
  }

  registerTask(taskName) {
    let tasks = this.toTaskNames(this.recipes)

    this.debugDump('this.recipes', this.recipes)
    this.debugDump('tasks', tasks)

    this.debug(`Registering task: ${Util.colors.green(taskName)} for ${stringify(tasks)}`)
    this.gulp.task(taskName, this.createHelpText(), () => {
      return this.run(tasks)
    })
  }

  flattenedRecipes() {
    let recipes = [].concat(...this.recipes)
    //this.debugDump(`flattenedRecipes`, recipes)
    return recipes
  }

  watchableRecipes() {
    // create an array of watchable recipes
    let watchableRecipes = []
    for (let recipe of this.flattenedRecipes()) {
      if (recipe.config.watch) {
        watchableRecipes.push(recipe)
      }
    }
    return watchableRecipes
  }

  registerWatchTask(taskName, recipes) {
    // generate watch task
    let watchableRecipes = this.watchableRecipes()
    if (watchableRecipes.length < 1) {
      this.debug(`No watchable recipes for task: ${Util.colors.green(taskName)}`)
      return
    }

    this.debug(`Registering task: ${Util.colors.green(taskName)}`)
    this.gulp.task(taskName, this.createWatchHelpText(), () => {

      // watch the watchable recipes and make them #run the series
      for (let recipe of watchableRecipes) {
        this.log(`[${Util.colors.green(taskName)}] watching ${recipe.taskName()} ${recipe.config.watch.glob}...`)
        this.gulp.watch(recipe.config.watch.glob, recipe.config.watch.options, (event) => {
          this.log(`[${Util.colors.green(taskName)}] ${event.path} was ${event.type}, running series...`);
          return Promise
            .resolve(this.run(recipes))
            .then(() => this.log(`[${Util.colors.green(taskName)}] finished`))
        })
      }
    })
  }

  run(tasks) {
    // generate the task sequence
    return this.runSequence(...tasks)
  }

  toTaskNames(recipes, tasks = []) {
    //this.debugDump(`toTaskNames`, recipes)
    for (let recipe of recipes) {
      //this.debugDump(`recipe taskName[${recipe.taskName? recipe.taskName() : ''}] isArray[${Array.isArray(recipe)}]`, recipe)
      if (Array.isArray(recipe)) {
        tasks.push(this.toTaskNames(recipe, []))
      }
      else {
        this.debug(`Adding to list ${recipe.taskName()}`)
        tasks.push(recipe.taskName())
      }
    }

    return tasks
  }

  // -----------------------------------
  // originally run-sequence code https://github.com/OverZealous/run-sequence
  // Copyright (c) 2014 [Phil DeJarnett](http://overzealous.com)
  // - Will be unnecessary with gulp 4.0
  // - Forced to include this/modify it as the #use(gulp) binding of the gulp instance didn't work with es class approach

  runSequence(...taskSets) {
    this.callBack = typeof taskSets[taskSets.length - 1] === 'function' ? taskSets.pop() : false
    this.debug(`currentTaskSet = null`)
    this.currentTaskSet = null
    this.verifyTaskSets(taskSets)
    this.taskSets = taskSets

    this.onEnd = (e) => this.onTaskEnd(e)
    this.onErr = (e) => this.onError(e)

    this.gulp.on('task_stop', this.onEnd)
    this.gulp.on('task_err', this.onErr)

    this.runNextSet()
  }

  finish(e) {
    this.debugDump(`finish`, e)
    this.gulp.removeListener('task_stop', this.onEnd)
    this.gulp.removeListener('task_err', this.onErr)

    let error = null
    if (e && e.err) {
      this.debugDump(`finish e`, e)
      //error = new Util.PluginError('run-sequence', {
      //  message: `An error occured in task [${e.task}].`
      //})
      error = {
        task: e.task,
        message: e.err,
        plugin: e.plugin || ''
      }
    }

    if (this.callback) {
      this.callback(error)
    }
    else if (error) {
      //this.log(Util.colors.red(error.toString()))
      this.notifyError(error)
    }
  }

  onError(err) {
    this.debugDump(`onError`, err)
    this.finish(err)
  }

  onTaskEnd(event) {
    this.debugDump(`onTaskEnd`, event)
    //this.debugDump(`this.currentTaskSet`, this.currentTaskSet)

    let i = this.currentTaskSet.indexOf(event.task)
    if (i > -1) {
      this.currentTaskSet.splice(i, 1)
    }
    if (this.currentTaskSet.length === 0) {
      this.runNextSet()
    }
  }

  runNextSet() {
    if (this.taskSets.length) {
      let command = this.taskSets.shift()
      if (!Array.isArray(command)) {
        command = [command]
      }
      this.debug(`currentTaskSet = ${command}`)
      this.currentTaskSet = command
      this.gulp.start(command)
    }
    else {
      this.finish()
    }
  }

  verifyTaskSets(taskSets, skipArrays, foundTasks = {}) {

    this.debug(`verifyTaskSets: ${stringify(taskSets)}`)

    if (taskSets.length === 0) {
      throw new Error('No tasks were provided to run-sequence')
    }

    for (let t of taskSets) {
      let isTask = (typeof t === "string")
      let isArray = !skipArrays && Array.isArray(t)

      if (!isTask && !isArray) {
        throw new Error(`Task ${t} is not a valid task string.`)
      }

      if (isTask && !this.gulp.hasTask(t)) {
        throw new Error(`Task ${t} is not configured as a task on gulp.`)
      }

      if (skipArrays && isTask) {
        if (foundTasks[t]) {
          throw new Error(`Task ${t} is listed more than once. This is probably a typo.`)
        }
        foundTasks[t] = true
      }

      if (isArray) {
        if (t.length === 0) {
          throw new Error(`An empty array was provided as a task set`)
        }
        this.verifyTaskSets(t, true, foundTasks)
      }
    }
  }
}

const node_modules$1 = findup('node_modules')


const Default$7 = {
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {

    if (!config.options.dest) {
      throw new Error(`options.dest filename must be specified.`)
    }

    super(gulp, preset, extend(true, {}, Default$7, NodeResolve, CommonJs, config))

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

  createHelpText(){
    return `Rollup ${this.config.source.options.cwd}/${this.config.source.glob} in the ${this.config.options.format} format to ${this.config.options.dest}`
  }

  run(watching = false) {
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
        this.notifyError(error, watching)
      })
  }
}

const Default$8 = {
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$8, config))
  }
}

const Default$9 = {
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$9, config))
  }
}

const Default$10 = {
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$10, config))
  }
}

const Default$11 = {
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$11, config))
  }
}

const Default$13 = {
  debug: false,
  watch: false,
  sync: true  // necessary so that tasks can be run in a series, can be overriden for other purposes
}

const BaseClean = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$13, config))
  }

  createHelpText(){
    // use the config to generate the dynamic help
    return `Cleans ${this.config.dest}`
  }

  run(watching = false) {
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

const Default$12 = {
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$12, config))
  }
}

const Default$14 = {
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$14, config))
  }
}

const Default$15 = {
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$15, config))
  }
}

const Default$16 = {
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$16, config))
  }
}

const Default$17 = {
  debug: false,
  watch: false,
  presetType: 'macro',
  task: {
    name: 'clean',
    help: 'Cleans images, stylesheets, and javascripts.'
  }
}

const Clean = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$17, config))

    this.cleanImages = new CleanImages(gulp, preset)
    this.cleanStylesheets = new CleanStylesheets(gulp, preset)
    this.cleanJavascripts = new CleanJavascripts(gulp, preset)
    this.cleanDigest = new CleanDigest(gulp, preset)
  }

  run() {
    this.cleanImages.run()
    this.cleanStylesheets.run()
    this.cleanJavascripts.run()
    this.cleanDigest.run()
  }
}

const Default$18 = {
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$18, config))
    this.browserSync = BrowserSync.create()
  }

  createHelpText() {
    return `Adds revision digest to assets from ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(watching = false) {

    // FIXME merge in the clean as a task


    return this.gulp.src(this.config.source.glob, this.config.source.options)
      //.pipe(changed(this.config.dest)) // ignore unchanged files
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(rev(this.config.options))
      .pipe(this.gulp.dest(this.config.dest))
      .pipe(rev.manifest())
      .pipe(this.gulp.dest(this.config.dest))
      .on('error', (error) => {
        this.notifyError(error, watching)
      })
      .pipe(this.browserSync.stream())

  }
}

const Default$19 = {
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$19, config))
    this.browserSync = BrowserSync.create()
  }

  createHelpText() {
    return `Minifies digest css from ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(watching = false) {

    // FIXME merge in the clean as a task


    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(cssnano(this.config.options))
      .pipe(this.gulp.dest(this.config.dest))
      .on('error', (error) => {
        this.notifyError(error, watching)
      })
      .pipe(this.browserSync.stream())

  }
}

const Default$20 = {
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
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    // resolve watch cwd based on test cwd
    super(gulp, preset, extend(true, {},
      Default$20,
      {watch: {options: {cwd: Preset.resolveConfig(preset, Default$20, config).test.options.cwd}}},
      config))
  }

  createHelpText() {
    return `Tests ${this.config.test.options.cwd}/${this.config.test.glob}`
  }

  run(watching = false) {
    let bundle = this.gulp.src(this.config.test.glob, this.config.test.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(mocha({reporter: 'nyan'})) // gulp-mocha needs filepaths so you can't have any plugins before it
      .on('error', (error) => {
        this.notifyError(error, watching)
      })

    return bundle
  }
}

/**
 *  This is the base for publish recipes using BuildControl
 */
const Default$22 = {

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
    super(gulp, preset, extend(true, {}, Default$22, config))

    // use the dir as the cwd to the BuildControl class
    this.config.options = extend(true, {debug: this.config.debug, cwd: this.config.dir}, this.config.options)
  }
}

const Default$21 = {
  task: {
    name: 'prepublish',
    help: 'Checks tag name and ensures directory has all files committed.'
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
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$21, config))
  }

  run() {
    let buildControl = new BuildControl(this.config.options)
    buildControl.prepublishCheck()
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
const Default$23 = {
  //debug: true,
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
    help: 'Assembles and pushes the build to a branch'
  }
}

const PublishBuild = class extends BasePublish {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$23, config))
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

  run() {
    let buildControl = new BuildControl(this.config.options)

    // bump the version and commit to git
    buildControl.npm.bump()

    this.prepareBuildFiles()

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

    // run the commit/tagging/pushing
    buildControl.run()

    // publish to npm
    buildControl.npm.publish()
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

export { Preset, Rails, Autoprefixer, EsLint, Images, Sass, ScssLint, TaskSeries, RollupEs, RollupCjs, RollupIife, RollupAmd, RollupUmd, CleanImages, CleanStylesheets, CleanJavascripts, CleanDigest, Clean, Rev, MinifyCss, Mocha, Prepublish, PublishBuild };
//# sourceMappingURL=gulp-pipeline.es.js.map