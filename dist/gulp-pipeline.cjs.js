'use strict';

function _interopDefault (ex) { return 'default' in ex ? ex['default'] : ex; }

var eslint = _interopDefault(require('gulp-eslint'));
var extend = _interopDefault(require('extend'));
var jscs = _interopDefault(require('gulp-jscs'));
var stylish = _interopDefault(require('gulp-jscs-stylish'));
var BrowserSync = _interopDefault(require('browser-sync'));
var babelify = _interopDefault(require('babelify'));
var browserify = _interopDefault(require('browserify'));
var source = _interopDefault(require('vinyl-source-stream'));
var watchify = _interopDefault(require('watchify'));
var Util = _interopDefault(require('gulp-util'));
var autoprefixer = _interopDefault(require('gulp-autoprefixer'));
var sass = _interopDefault(require('gulp-sass'));
var sourcemaps = _interopDefault(require('gulp-sourcemaps'));
var debug = _interopDefault(require('gulp-debug'));

var babelHelpers = {};

babelHelpers.classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

babelHelpers.createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

babelHelpers.inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

babelHelpers.possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

babelHelpers;

var Default$3 = {
  watch: true,
  debug: false
};

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
var BaseRecipe = function () {

  /**
   *
   * @param gulp
   * @param config
   */

  function BaseRecipe(gulp, config) {
    var _this = this;

    babelHelpers.classCallCheck(this, BaseRecipe);

    this.gulp = gulp;
    this.config = extend(true, {}, Default$3, config);

    if (this.config.task) {
      // generate primary task e.g. sass
      var name = this.taskName();
      this.debug('Registering task: ' + Util.colors.green(name));
      this.gulp.task(name, function () {
        _this.run();
      });
    }

    if (this.config.watch) {
      // generate watch task e.g. sass:watch
      var name = this.watchTaskName();
      this.debug('Registering task: ' + Util.colors.green(name));
      this.gulp.task(name, function () {
        _this.watch();
      });
    }
  }

  babelHelpers.createClass(BaseRecipe, [{
    key: 'taskName',
    value: function taskName() {
      return this.config.task.name;
    }
  }, {
    key: 'watchTaskName',
    value: function watchTaskName() {
      if (this.config.watch && this.config.watch.name) {
        return this.config.watch.name;
      } else {
        return this.taskName() + ':watch';
      }
    }
  }, {
    key: 'watch',
    value: function watch() {
      this.gulp.watch(this.config.watch.glob, [this.taskName()]);
    }

    // ----------------------------------------------
    // protected

  }, {
    key: 'log',
    value: function log(msg) {
      Util.log(msg);
    }
  }, {
    key: 'debug',
    value: function debug(msg) {
      if (this.config.debug) {
        this.log(msg);
      }
    }

    // ----------------------------------------------
    // private

    // ----------------------------------------------
    // static

  }]);
  return BaseRecipe;
}();

var Default = {
  task: {
    name: 'eslint'
  },
  options: {}
};

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
var EsLint = function (_BaseRecipe) {
  babelHelpers.inherits(EsLint, _BaseRecipe);

  /**
   *
   * @param gulp
   * @param config
   */

  function EsLint(gulp) {
    var config = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    babelHelpers.classCallCheck(this, EsLint);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(EsLint).call(this, gulp, extend(true, {}, Default, config)));
  }

  babelHelpers.createClass(EsLint, [{
    key: 'run',
    value: function run() {
      return this.gulp.src(this.config.source)
      // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
      .pipe(eslint(this.config.options))
      // eslint.format() outputs the lint results to the console. Alternatively use eslint.formatEach() (see Docs).
      .pipe(eslint.format())
      // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.
      .pipe(eslint.failAfterError()).pipe(jscs()) // enforce style guide
      .pipe(stylish()) // log style errors
      //.pipe(jscs.reporter())
      .pipe(jscs.reporter('fail')); // fail on error
    }

    // ----------------------------------------------
    // protected

    // ----------------------------------------------
    // private

    // ----------------------------------------------
    // static

  }]);
  return EsLint;
}(BaseRecipe);

// TODO: sourcemaps

var Default$1 = {
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
};

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
var Browserify = function (_BaseRecipe) {
  babelHelpers.inherits(Browserify, _BaseRecipe);
  babelHelpers.createClass(Browserify, null, [{
    key: 'Default',
    get: function get() {
      return {};
    }

    /**
     *
     * @param gulp
     * @param config
     */

  }]);

  function Browserify(gulp) {
    var config = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    babelHelpers.classCallCheck(this, Browserify);

    // add the source to the browserify entries if unspecified - do this after initial config is merged

    var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Browserify).call(this, gulp, extend(true, {}, Default$1, config)));

    _this.config = extend(true, { browserify: { entries: _this.config.source } }, // default
    _this.config // override if passed in
    );

    _this.browserSync = BrowserSync.create();
    _this.bundler = watchify(browserify(_this.config.options).transform(babelify));
    return _this;
  }

  babelHelpers.createClass(Browserify, [{
    key: 'run',
    value: function run() {
      new EsLint(this.gulp, { source: this.config.source }).run();
      this.bundler.bundle().on('error', Util.log.bind(Util, 'Browserify Error')).pipe(source('index.js')).pipe(this.gulp.dest(this.config.dest)).pipe(this.browserSync.stream());
    }
  }, {
    key: 'watch',
    value: function watch() {
      var _this2 = this;

      this.bundler.on('update', function () {
        console.log("Recompiling JS...");
        _this2.run();
      });
    }

    // ----------------------------------------------
    // protected

    // ----------------------------------------------
    // private

    // ----------------------------------------------
    // static

  }]);
  return Browserify;
}(BaseRecipe);

var Default$4 = {
  options: { // from bootstrap
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
    'Edge >= 12', 'Explorer >= 9',
    // Out of leniency, we prefix these 1 version further back than the official policy.
    'iOS >= 8', 'Safari >= 8',
    // The following remain NOT officially supported, but we're lenient and include their prefixes to avoid severely breaking in them.
    'Android 2.3', 'Android >= 4', 'Opera >= 12']
  }
};

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
var Autoprefixer = function (_BaseRecipe) {
  babelHelpers.inherits(Autoprefixer, _BaseRecipe);

  /**
   *
   * @param gulp
   * @param config
   */

  function Autoprefixer(gulp) {
    var config = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    babelHelpers.classCallCheck(this, Autoprefixer);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Autoprefixer).call(this, gulp, extend(true, {}, Default$4, config)));
  }

  babelHelpers.createClass(Autoprefixer, [{
    key: 'run',
    value: function run() {
      // FIXME: is this right or wrong?  this class initially was extracted for reuse of Default options
      return this.gulp.src(this.config.source).pipe(autoprefixer(this.config.options)).pipe(this.gulp.dest(this.config.dest));
    }

    // ----------------------------------------------
    // protected

    // ----------------------------------------------
    // private

    // ----------------------------------------------
    // static

  }]);
  return Autoprefixer;
}(BaseRecipe);

// TODO: scsslint

var Default$2 = {
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
    errLogToConsole: true,
    includePaths: ['node_modules']
  },
  // capture defaults from autoprefixer class
  autoprefixer: {
    options: Default$4.options
  }
};

/**
 * ----------------------------------------------
 * Class Definition
 * ----------------------------------------------
 */
var Sass = function (_BaseRecipe) {
  babelHelpers.inherits(Sass, _BaseRecipe);

  /**
   *
   * @param gulp
   * @param config
   */

  function Sass(gulp) {
    var config = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    babelHelpers.classCallCheck(this, Sass);

    var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Sass).call(this, gulp, extend(true, {}, Default$2, config)));

    _this.browserSync = BrowserSync.create();
    return _this;
  }

  babelHelpers.createClass(Sass, [{
    key: 'run',
    value: function run() {
      var bundle = this.gulp.src(this.config.source);

      if (this.config.debug) {
        bundle.pipe(debug());
      }

      bundle.pipe(sourcemaps.init()).pipe(sass(this.config.options)).pipe(sourcemaps.write()).pipe(autoprefixer(this.config.autoprefixer.options)).pipe(this.gulp.dest(this.config.dest)).pipe(this.browserSync.stream());

      return bundle;
    }

    // ----------------------------------------------
    // protected

    // ----------------------------------------------
    // private

    // ----------------------------------------------
    // static

  }]);
  return Sass;
}(BaseRecipe);

exports.EsLint = EsLint;
exports.Browserify = Browserify;
exports.Sass = Sass;
//# sourceMappingURL=gulp-pipeline.cjs.js.map