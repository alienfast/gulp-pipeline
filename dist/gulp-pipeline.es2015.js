import autoprefixer from 'gulp-autoprefixer';
import extend from 'extend';
import BrowserSync from 'browser-sync';
import babelify from 'babelify';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import watchify from 'watchify';
import Util from 'gulp-util';
import eslint from 'gulp-eslint';
import jscs from 'gulp-jscs';
import stylish from 'gulp-jscs-stylish';
import debug from 'gulp-debug';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import scssLint from 'gulp-scss-lint';
import scssLintStylish from 'gulp-scss-lint-stylish';
import notify from 'gulp-notify';

const Default$6 = {
  watch: true,
  debug: false
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const Base = class {

  /**
   *
   * @param gulp
   * @param config
   */
  constructor(gulp, config) {
    this.gulp = gulp
    this.config = extend(true, {}, Default$6, config)
  }

  // ----------------------------------------------
  // protected
  log(msg) {
    Util.log(msg)
  }

  debug(msg) {
    if (this.config.debug) {
      this.log(msg)
    }
  }

  notifyError(error) {
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
    this.gulp.emit('end')
  }

  // ----------------------------------------------
  // private

  // ----------------------------------------------
  // static

}

const Default$5 = {
  watch: true,
  debug: false
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const BaseRecipe = class extends Base {

  /**
   *
   * @param gulp
   * @param config
   */
  constructor(gulp, config) {
    super(gulp, extend(true, {}, Default$5, config))

    if (this.config.task) {
      // generate primary task e.g. sass
      let name = this.taskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)
      this.gulp.task(name, () => {
        this.run()
      })
    }

    if (this.config.watch) {
      // generate watch task e.g. sass:watch
      let name = this.watchTaskName()
      this.debug(`Registering task: ${Util.colors.green(name)}`)
      this.gulp.task(name, () => {
        this.watch()
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

  watch() {
    this.gulp.watch(this.config.watch.glob, [this.taskName()])
  }

  // ----------------------------------------------
  // protected

  // ----------------------------------------------
  // private

  // ----------------------------------------------
  // static

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

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const Autoprefixer = class extends BaseRecipe {

  /**
   *
   * @param gulp
   * @param config
   */
  constructor(gulp, config = {}) {
    super(gulp, extend(true, {}, AutoprefixerDefault, config))
  }

  run() {
    // FIXME: is this right or wrong?  this class initially was extracted for reuse of Default options
    return this.gulp.src(this.config.source)
      .pipe(autoprefixer(this.config.options))
      .pipe(this.gulp.dest(this.config.dest))
  }

  // ----------------------------------------------
  // protected

  // ----------------------------------------------
  // private

  // ----------------------------------------------
  // static

}

const Default$1 = {
  task: {
    name: 'eslint'
  },
  options: {}
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const EsLint = class extends BaseRecipe {

  /**
   *
   * @param gulp
   * @param config
   */
  constructor(gulp, config = {}) {
    super(gulp, extend(true, {}, Default$1, config))
  }

  run() {
    return this.gulp.src(this.config.source)
      // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
      .pipe(eslint(this.config.options))
      // eslint.format() outputs the lint results to the console. Alternatively use eslint.formatEach() (see Docs).
      .pipe(eslint.format())
      // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.
      .pipe(eslint.failAfterError())
      .pipe(jscs())      // enforce style guide
      .pipe(stylish())  // log style errors
      //.pipe(jscs.reporter())
      .pipe(jscs.reporter('fail')) // fail on error
  }

  // ----------------------------------------------
  // protected

  // ----------------------------------------------
  // private

  // ----------------------------------------------
  // static

}

// TODO: sourcemaps

const Default = {
  task: {
    name: 'browserify'
  },
  watch: {
    glob: './app/assets/javascripts/**/*.js'
  },
  source: './app/assets/javascripts/index.js',
  dest: './public/assets',
  options: {
    debug: true
  }
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const Browserify = class extends BaseRecipe {
  static get Default() {
    return {}
  }

  /**
   *
   * @param gulp
   * @param config
   */
  constructor(gulp, config = {}) {
    super(gulp, extend(true, {}, Default, config))

    // add the source to the browserify entries if unspecified - do this after initial config is merged
    this.config = extend(true,
      {browserify: {entries: this.config.source}}, // default
      this.config // override if passed in
    )

    this.browserSync = BrowserSync.create()
    this.bundler = watchify(browserify(this.config.options).transform(babelify))
  }

  run() {
    new EsLint(this.gulp, {source: this.config.source}).run()
    this.bundler.bundle()
      .on('error', Util.log.bind(Util, 'Browserify Error'))
      .pipe(source('index.js'))
      .pipe(this.gulp.dest(this.config.dest))
      .pipe(this.browserSync.stream())
  }

  watch() {
    this.bundler.on('update', () => {
      console.log("Recompiling JS...")
      this.run()
    })
  }

  // ----------------------------------------------
  // protected

  // ----------------------------------------------
  // private

  // ----------------------------------------------
  // static

}

// TODO: scsslint

const Default$2 = {
  debug: true,
  task: {
    name: 'sass'
  },
  watch: {
    glob: './app/assets/stylesheets/**/*.scss'
  },
  source: './app/assets/stylesheets/application.scss',
  dest: 'public/stylesheets',
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


/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const Sass = class extends BaseRecipe {

  /**
   *
   * @param gulp
   * @param config
   */
  constructor(gulp, config = {}) {
    super(gulp, extend(true, {}, Default$2, config))
    this.browserSync = BrowserSync.create()
  }

  run() {
    let bundle = this.gulp.src(this.config.source)

    if (this.config.debug) {
      bundle.pipe(debug())
    }

    bundle
      .pipe(sourcemaps.init())
      .pipe(sass(this.config.options))
      .on('error', (error) => {
        this.notifyError(error)
      })
      .pipe(autoprefixer(this.config.autoprefixer.options))
      .pipe(sourcemaps.write())
      .pipe(this.gulp.dest(this.config.dest))
      .pipe(this.browserSync.stream())

    return bundle
  }

  // ----------------------------------------------
  // protected

  // ----------------------------------------------
  // private

  // ----------------------------------------------
  // static

}

const Default$3 = {
  debug: true,
  task: {
    name: 'scsslint'
  },
  watch: {
    glob: './app/assets/stylesheets/**/*.scss'
  },
  source: './app/assets/stylesheets/**/*.scss',
  options: {
    customReport: scssLintStylish
  }
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const ScssLint = class extends BaseRecipe {

  /**
   *
   * @param gulp
   * @param config
   */
  constructor(gulp, config = {}) {
    super(gulp, extend(true, {}, Default$3, config))
  }

  run() {
    return this.gulp.src(this.config.source)
      .pipe(scssLint(this.config.options))

  }

  // ----------------------------------------------
  // protected

  // ----------------------------------------------
  // private

  // ----------------------------------------------
  // static

}

const Default$4 = {
  watch: false
}

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
const TaskSequence = class extends Base {

  /**
   *
   * @param gulp
   * @param config
   */
  constructor(gulp, taskName, recipes, config = {}) {
    super(gulp, extend(true, {}, Default$4, config))

    // generate the task sequence
    let tasks = []
    for (let recipe of recipes) {
      if (this.config.watch) {
        tasks.push(recipe.watchTaskName())
      } else {
        tasks.push(recipe.taskName())
      }
    }

    this.debug(`Registering task: ${Util.colors.green(taskName)}`)
    this.gulp.task(taskName, tasks)
  }


  // ----------------------------------------------
  // protected

  // ----------------------------------------------
  // private

  // ----------------------------------------------
  // static

}

export { Autoprefixer, Browserify, EsLint, Sass, ScssLint, TaskSequence };
//# sourceMappingURL=gulp-pipeline.es2015.js.map