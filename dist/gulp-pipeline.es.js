import autoprefixer from 'gulp-autoprefixer';
import extend from 'extend';
import gulpif from 'gulp-if';
import debug from 'gulp-debug';
import eslint from 'gulp-eslint';
import BrowserSync from 'browser-sync';
import changed from 'gulp-changed';
import imagemin from 'gulp-imagemin';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import scssLint from 'gulp-scss-lint';
import scssLintStylish from 'gulp-scss-lint-stylish';
import Util from 'gulp-util';
import stringify from 'stringify-object';
import runSequence from 'run-sequence';
import { rollup } from 'rollup';
import glob from 'glob';
import babel from 'rollup-plugin-babel';
import notify from 'gulp-notify';
import del from 'del';

const Default$15 = {
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
    this.gulp = gulp
    this.config = extend(true, {}, Default$15, config)
    this.debug(`[${this.constructor.name}] using resolved config: ${stringify(this.config)}`)
  }

  // ----------------------------------------------
  // protected
  log(msg) {
    Util.log(msg)
  }

  debug(msg) {
    if (this.config.debug) {
      this.log(`[${Util.colors.cyan('debug')}] ${msg}`)
    }
  }

  debugDump(msg, obj){
    this.debug(`${msg}:\n${stringify(obj)}`)
  }

  notifyError(error, watching = false) {
    let lineNumber = (error.lineNumber) ? `Line ${error.lineNumber} -- ` : ''

    notify({
      title: `Task [${this.taskName()}] Failed in [${error.plugin}]`,
      message: `${lineNumber}See console.`,
      sound: 'Sosumi' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
    }).write(error)

    let tag = Util.colors.black.bgRed
    let report = `

${tag('    Task:')} [${Util.colors.cyan(this.taskName())}]
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

const Default$14 = {
  watch: true,
  debug: false
}

const BaseRecipe = class extends Base {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config) {

    if (!preset) {
      throw new Error(`Preset must be specified.  Please use one from the preset.js or specify a custom preset configuration.`)
    }

    if (!config || !config.presetType) {
      throw new Error(`'presetType' must be specified in the config (usually the Default config).  See preset.js for a list of types such as javascripts, stylesheets, etc.`)
    }

    let presetTypeConfig = null
    if(config.presetType !== 'macro') {
      presetTypeConfig = preset[config.presetType]
      if (!presetTypeConfig) {
        throw new Error(`Unable to resolve configuration for presetType: ${config.presetType} from preset: ${stringify(preset)}`)
      }
    }
    else {
      presetTypeConfig = {}
    }

    super(gulp, extend(true, {}, Default$14, presetTypeConfig, config))
    this.registerTask()
    this.registerWatchTask()
  }

  registerWatchTask() {
    if (this.config.watch) {
      // generate watch task e.g. sass:watch
      let name = this.watchTaskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)
      this.gulp.task(name, () => {
        //this.gulp.watch(this.config.source.glob, this.config.source.options, [this.taskName()])

        this.gulp.watch(this.config.source.glob, this.config.source.options, (event) => {
          this.log(`File ${event.path} was ${event.type}, running ${this.taskName()}...`);
          this.run(true)
        })
      })
    }
  }

  registerTask() {
    if (this.config.task) {
      // generate primary task e.g. sass
      let name = this.taskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)
      this.gulp.task(name, () => {
        //this.log(`Running task: ${Util.colors.green(name)}`)
        this.run()
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
   * @param preset - base preset configuration - either one from presets.js or a custom hash
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

const Default = {
  debug: false,
  presetType: 'javascripts',
  task: {
    name: 'eslint'
  },
  watch: {
    glob: '**/*.js',
    options: {
      //cwd: ** resolved from preset **
    }
  },
  source: {
    glob: '**/*.js',
    options: {
      //cwd: ** resolved from preset **
    }
  },
  options: {}
}

const EsLint = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default, config))
  }

  run(watching = false) {
    // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
    let bundle = this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(eslint(this.config.options))
      .pipe(eslint.format()) // outputs the lint results to the console. Alternatively use eslint.formatEach() (see Docs).
      .pipe(gulpif(!watching, eslint.failAfterError())) // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.

    // FIXME: even including any remnant of JSCS at this point broke everything through the unfound requirement of babel 5.x through babel-jscs.  I can't tell where this occurred, but omitting gulp-jscs for now gets me past this issue.  Revisit this when there are clear updates to use babel 6
    //.pipe(jscs())      // enforce style guide
    //.pipe(stylish())  // log style errors
    //.pipe(jscs.reporter('fail')) // fail on error

    return bundle
  }
}

const Default$1 = {
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
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$1, config))
    this.browserSync = BrowserSync.create()
  }

  run(watching = false) {
    return this.gulp.src(this.config.source.glob, this.config.source.options)
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

const Default$2 = {
  debug: false,
  presetType: 'stylesheets',
  task: {
    name: 'sass'
  },
  watch: {
    glob: '**/*.scss',
    options: {
      //cwd: ** resolved from preset **
    }
  },
  source: {
    glob: ['*.scss', '!_*.scss'],
    options: {
      //cwd: ** resolved from preset **
    }
  },
  options: {
    indentedSyntax: true,
    errLogToConsole: false,
    includePaths: ['node_modules']
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
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$2, config))
    this.browserSync = BrowserSync.create()
  }

  run(watching = false) {
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

const Default$3 = {
  debug: false,
  presetType: 'stylesheets',
  task: {
    name: 'scsslint'
  },
  watch: {
    glob: '**/*.scss',
    options: {
      //cwd: ** resolved from preset **
    }
  },
  source: {
    glob: '**/*.scss',
    options: {
      //cwd: ** resolved from preset **
    }
  },
  options: {
    customReport: scssLintStylish
  }
}

const ScssLint = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$3, config))
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

const Default$4 = {
  debug: false,
  watch: false
}

const TaskSeries = class extends Base {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, taskName, recipes, config = {}) {
    super(gulp, extend(true, {}, Default$4, config))

    // generate the task sequence
    let tasks = []
    this.toTaskNames(recipes, tasks);

    this.debug(`Registering task: ${Util.colors.green(taskName)} for ${stringify(tasks)}`)
    this.gulp.task(taskName, () => {
      //this.log(`Running task: ${Util.colors.green(taskName)}`)
      runSequence(...tasks)
    })
  }

  toTaskNames(recipes, tasks) {
    for (let recipe of recipes) {
      if (Array.isArray(recipe)) {
        let series = []
        this.toTaskNames(recipe, series)
        tasks.push(series)
      }
      else {
        if (this.config.watch) {
          // if the series is a 'watch', only add 'watch' enabled recipes
          if( recipe.config.watch) {
            tasks.push(recipe.watchTaskName())
          }
        } else {
          tasks.push(recipe.taskName())
        }
      }
    }
  }
}

const Default$5 = {
  debug: false,
  presetType: 'javascripts',
  task: {
    name: 'rollup:es'
  },

  watch: {
    glob: '**/*.js',
    options: {
      //cwd: ** resolved from preset **
    }
  },
  source: {
    glob: 'index.js',
    options: {
      //cwd: ** resolved from preset **
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

const RollupEs = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$5, config))
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

  run(watching = false) {
    let options = extend(true, {
        entry: this.resolveEntry(),
        onwarn: (message) => {
          //this.notifyError(message, watching)
          this.log(message)
        }
      },
      this.config.options)

    if (!options.dest) {
      throw new Error(`dest must be specified.`)
    }

    this.debug(`Executing rollup with options: ${stringify(options)}`)

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

const Default$6 = {
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
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$6, config))
  }
}

const Default$7 = {
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
const RollupIife = class extends RollupCjs {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$7, config))
  }
}

const Default$8 = {
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
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$8, config))
  }
}

const Default$9 = {
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
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$9, config))
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
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$16, config))
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

const Default$10 = {
  presetType: 'images',
  task: {
    name: 'clean:images'
  }
}

const CleanImages = class extends BaseClean {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$10, config))
  }
}

const Default$11 = {
  presetType: 'stylesheets',
  task: {
    name: 'clean:stylesheets'
  }
}

const CleanStylesheets = class extends BaseClean {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$11, config))
  }
}

const Default$12 = {
  presetType: 'javascripts',
  task: {
    name: 'clean:javascripts'
  }
}

const CleanJavascripts = class extends BaseClean {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from presets.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$12, config))
  }
}

const Default$13 = {
  debug: false,
  watch: false,
  presetType: 'macro',
  task: {
    name: 'clean'
  }
}

const Clean = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default$13, config))

    this.cleanImages = new CleanImages(gulp, preset)
    this.cleanStylesheets = new CleanStylesheets(gulp, preset)
    this.cleanJavascripts = new CleanJavascripts(gulp, preset)
  }

  run() {
    this.cleanImages.run()
    this.cleanStylesheets.run()
    this.cleanJavascripts.run()
  }
}

export { Autoprefixer, EsLint, Images, Sass, ScssLint, TaskSeries, RollupEs, RollupCjs, RollupIife, RollupAmd, RollupUmd, CleanImages, CleanStylesheets, CleanJavascripts, Clean };
//# sourceMappingURL=gulp-pipeline.es.js.map