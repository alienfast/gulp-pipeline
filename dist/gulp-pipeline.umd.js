(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('gulp-autoprefixer'), require('extend'), require('gulp-if'), require('gulp-debug'), require('gulp-eslint'), require('browser-sync'), require('gulp-changed'), require('gulp-imagemin'), require('gulp-sass'), require('gulp-sourcemaps'), require('gulp-scss-lint'), require('gulp-scss-lint-stylish'), require('gulp-util'), require('stringify-object'), require('run-sequence'), require('rollup'), require('glob'), require('rollup-plugin-babel'), require('gulp-notify'), require('del')) :
  typeof define === 'function' && define.amd ? define(['exports', 'gulp-autoprefixer', 'extend', 'gulp-if', 'gulp-debug', 'gulp-eslint', 'browser-sync', 'gulp-changed', 'gulp-imagemin', 'gulp-sass', 'gulp-sourcemaps', 'gulp-scss-lint', 'gulp-scss-lint-stylish', 'gulp-util', 'stringify-object', 'run-sequence', 'rollup', 'glob', 'rollup-plugin-babel', 'gulp-notify', 'del'], factory) :
  (factory((global.gulpPipeline = {}),global.autoprefixer,global.extend,global.gulpif,global.debug,global.eslint,global.BrowserSync,global.changed,global.imagemin,global.sass,global.sourcemaps,global.scssLint,global.scssLintStylish,global.Util,global.stringify,global.runSequence,global.rollup,global.glob,global.babel,global.notify,global.del));
}(this, function (exports,autoprefixer,extend,gulpif,debug,eslint,BrowserSync,changed,imagemin,sass,sourcemaps,scssLint,scssLintStylish,Util,stringify,runSequence,rollup,glob,babel,notify,del) { 'use strict';

  autoprefixer = 'default' in autoprefixer ? autoprefixer['default'] : autoprefixer;
  extend = 'default' in extend ? extend['default'] : extend;
  gulpif = 'default' in gulpif ? gulpif['default'] : gulpif;
  debug = 'default' in debug ? debug['default'] : debug;
  eslint = 'default' in eslint ? eslint['default'] : eslint;
  BrowserSync = 'default' in BrowserSync ? BrowserSync['default'] : BrowserSync;
  changed = 'default' in changed ? changed['default'] : changed;
  imagemin = 'default' in imagemin ? imagemin['default'] : imagemin;
  sass = 'default' in sass ? sass['default'] : sass;
  sourcemaps = 'default' in sourcemaps ? sourcemaps['default'] : sourcemaps;
  scssLint = 'default' in scssLint ? scssLint['default'] : scssLint;
  scssLintStylish = 'default' in scssLintStylish ? scssLintStylish['default'] : scssLintStylish;
  Util = 'default' in Util ? Util['default'] : Util;
  stringify = 'default' in stringify ? stringify['default'] : stringify;
  runSequence = 'default' in runSequence ? runSequence['default'] : runSequence;
  glob = 'default' in glob ? glob['default'] : glob;
  babel = 'default' in babel ? babel['default'] : babel;
  notify = 'default' in notify ? notify['default'] : notify;
  del = 'default' in del ? del['default'] : del;

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

  var Default$15 = {
    watch: true,
    debug: false
  };

  var Base = function () {

    /**
     *
     * @param gulp - gulp instance
     * @param config - customized overrides
     */

    function Base(gulp, config) {
      babelHelpers.classCallCheck(this, Base);

      this.gulp = gulp;
      this.config = extend(true, {}, Default$15, config);
      this.debug('[' + this.constructor.name + '] using resolved config: ' + stringify(this.config));
    }

    // ----------------------------------------------
    // protected

    babelHelpers.createClass(Base, [{
      key: 'log',
      value: function log(msg) {
        Util.log(msg);
      }
    }, {
      key: 'debug',
      value: function debug(msg) {
        if (this.config.debug) {
          this.log('[' + Util.colors.cyan('debug') + '] ' + msg);
        }
      }
    }, {
      key: 'debugDump',
      value: function debugDump(msg, obj) {
        this.debug(msg + ':\n' + stringify(obj));
      }
    }, {
      key: 'notifyError',
      value: function notifyError(error) {
        var watching = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

        var lineNumber = error.lineNumber ? 'Line ' + error.lineNumber + ' -- ' : '';

        notify({
          title: 'Task [' + this.taskName() + '] Failed in [' + error.plugin + ']',
          message: lineNumber + 'See console.',
          sound: 'Sosumi' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
        }).write(error);

        var tag = Util.colors.black.bgRed;
        var report = '\n\n' + tag('    Task:') + ' [' + Util.colors.cyan(this.taskName()) + ']\n' + tag('  Plugin:') + ' [' + error.plugin + ']\n' + tag('   Error:') + '\n' + error.message;

        if (error.lineNumber) {
          report += tag('    Line:') + ' ' + error.lineNumber + '\n';
        }
        if (error.fileName) {
          report += tag('    File:') + ' ' + error.fileName + '\n';
        }
        this.log(report);

        // Prevent the 'watch' task from stopping
        if (!watching) {
          this.gulp.emit('end');
        }
      }
    }, {
      key: 'debugOptions',
      value: function debugOptions() {
        return { title: '[' + Util.colors.cyan('debug') + '][' + Util.colors.cyan(this.taskName()) + ']' };
      }
    }]);
    return Base;
  }();

  var Default$14 = {
    watch: true,
    debug: false
  };

  var BaseRecipe = function (_Base) {
    babelHelpers.inherits(BaseRecipe, _Base);

    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from presets.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function BaseRecipe(gulp, preset, config) {
      babelHelpers.classCallCheck(this, BaseRecipe);

      if (!preset) {
        throw new Error('Preset must be specified.  Please use one from the preset.js or specify a custom preset configuration.');
      }

      if (!config || !config.presetType) {
        throw new Error('\'presetType\' must be specified in the config (usually the Default config).  See preset.js for a list of types such as javascripts, stylesheets, etc.');
      }

      var presetTypeConfig = null;
      if (config.presetType !== 'macro') {
        presetTypeConfig = preset[config.presetType];
        if (!presetTypeConfig) {
          throw new Error('Unable to resolve configuration for presetType: ' + config.presetType + ' from preset: ' + stringify(preset));
        }
      } else {
        presetTypeConfig = {};
      }

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(BaseRecipe).call(this, gulp, extend(true, {}, Default$14, presetTypeConfig, config)));

      _this.registerTask();
      _this.registerWatchTask();
      return _this;
    }

    babelHelpers.createClass(BaseRecipe, [{
      key: 'registerWatchTask',
      value: function registerWatchTask() {
        var _this2 = this;

        if (this.config.watch) {
          // generate watch task e.g. sass:watch
          var name = this.watchTaskName();
          this.debug('Registering task: ' + Util.colors.green(name));
          this.gulp.task(name, function () {
            //this.gulp.watch(this.config.source.glob, this.config.source.options, [this.taskName()])

            _this2.gulp.watch(_this2.config.source.glob, _this2.config.source.options, function (event) {
              _this2.log('File ' + event.path + ' was ' + event.type + ', running ' + _this2.taskName() + '...');
              _this2.run(true);
            });
          });
        }
      }
    }, {
      key: 'registerTask',
      value: function registerTask() {
        var _this3 = this;

        if (this.config.task) {
          // generate primary task e.g. sass
          var name = this.taskName();
          this.debug('Registering task: ' + Util.colors.green(name));
          this.gulp.task(name, function () {
            //this.log(`Running task: ${Util.colors.green(name)}`)
            _this3.run();
          });
        }
      }
    }, {
      key: 'taskName',
      value: function taskName() {
        return this.config.task.name || this.constructor.name; // guarantee something is present for error messages
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
    }]);
    return BaseRecipe;
  }(Base);

  var AutoprefixerDefault = {
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

  var Autoprefixer = function (_BaseRecipe) {
    babelHelpers.inherits(Autoprefixer, _BaseRecipe);

    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from presets.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function Autoprefixer(gulp, preset) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, Autoprefixer);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Autoprefixer).call(this, gulp, preset, extend(true, {}, AutoprefixerDefault, config)));
    }

    babelHelpers.createClass(Autoprefixer, [{
      key: 'run',
      value: function run() {
        var _this2 = this;

        var watching = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

        // FIXME: is this right or wrong?  this class initially was extracted for reuse of Default options
        return this.gulp.src(this.config.source).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(autoprefixer(this.config.options)).on('error', function (error) {
          _this2.notifyError(error, watching);
        }).pipe(this.gulp.dest(this.config.dest));
      }
    }]);
    return Autoprefixer;
  }(BaseRecipe);

  var Default = {
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
  };

  var EsLint = function (_BaseRecipe) {
    babelHelpers.inherits(EsLint, _BaseRecipe);

    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from presets.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function EsLint(gulp, preset) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, EsLint);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(EsLint).call(this, gulp, preset, extend(true, {}, Default, config)));
    }

    babelHelpers.createClass(EsLint, [{
      key: 'run',
      value: function run() {
        var watching = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

        // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
        var bundle = this.gulp.src(this.config.source.glob, this.config.source.options).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(eslint(this.config.options)).pipe(eslint.format()) // outputs the lint results to the console. Alternatively use eslint.formatEach() (see Docs).
        .pipe(gulpif(!watching, eslint.failAfterError())); // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.

        // FIXME: even including any remnant of JSCS at this point broke everything through the unfound requirement of babel 5.x through babel-jscs.  I can't tell where this occurred, but omitting gulp-jscs for now gets me past this issue.  Revisit this when there are clear updates to use babel 6
        //.pipe(jscs())      // enforce style guide
        //.pipe(stylish())  // log style errors
        //.pipe(jscs.reporter('fail')) // fail on error

        return bundle;
      }
    }]);
    return EsLint;
  }(BaseRecipe);

  var Default$1 = {
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
  };

  var Images = function (_BaseRecipe) {
    babelHelpers.inherits(Images, _BaseRecipe);

    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from presets.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function Images(gulp, preset) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, Images);

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Images).call(this, gulp, preset, extend(true, {}, Default$1, config)));

      _this.browserSync = BrowserSync.create();
      return _this;
    }

    babelHelpers.createClass(Images, [{
      key: 'run',
      value: function run() {
        var _this2 = this;

        var watching = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

        return this.gulp.src(this.config.source.glob, this.config.source.options).pipe(changed(this.config.dest)) // ignore unchanged files
        .pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(imagemin(this.config.options)).on('error', function (error) {
          _this2.notifyError(error, watching);
        }).pipe(this.gulp.dest(this.config.dest)).pipe(this.browserSync.stream());
      }
    }]);
    return Images;
  }(BaseRecipe);

  var Default$2 = {
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
  };

  var Sass = function (_BaseRecipe) {
    babelHelpers.inherits(Sass, _BaseRecipe);

    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from presets.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function Sass(gulp, preset) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, Sass);

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Sass).call(this, gulp, preset, extend(true, {}, Default$2, config)));

      _this.browserSync = BrowserSync.create();
      return _this;
    }

    babelHelpers.createClass(Sass, [{
      key: 'run',
      value: function run() {
        var _this2 = this;

        var watching = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

        return this.gulp.src(this.config.source.glob, this.config.source.options).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(sourcemaps.init()).pipe(sass(this.config.options)).on('error', function (error) {
          _this2.notifyError(error, watching);
        }).pipe(autoprefixer(this.config.autoprefixer.options)).pipe(sourcemaps.write()).pipe(this.gulp.dest(this.config.dest)).pipe(this.browserSync.stream());
      }
    }]);
    return Sass;
  }(BaseRecipe);

  var Default$3 = {
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
  };

  var ScssLint = function (_BaseRecipe) {
    babelHelpers.inherits(ScssLint, _BaseRecipe);

    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from presets.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function ScssLint(gulp, preset) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, ScssLint);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(ScssLint).call(this, gulp, preset, extend(true, {}, Default$3, config)));
    }

    babelHelpers.createClass(ScssLint, [{
      key: 'run',
      value: function run() {
        var _this2 = this;

        var watching = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

        return this.gulp.src(this.config.source.glob, this.config.source.options).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(scssLint(this.config.options)).on('error', function (error) {
          _this2.notifyError(error, watching);
        });
      }
    }]);
    return ScssLint;
  }(BaseRecipe);

  var Default$4 = {
    debug: false,
    watch: false
  };

  var TaskSeries = function (_Base) {
    babelHelpers.inherits(TaskSeries, _Base);

    /**
     *
     * @param gulp - gulp instance
     * @param config - customized overrides
     */

    function TaskSeries(gulp, taskName, recipes) {
      var config = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];
      babelHelpers.classCallCheck(this, TaskSeries);

      // generate the task sequence

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(TaskSeries).call(this, gulp, extend(true, {}, Default$4, config)));

      var tasks = [];
      _this.toTaskNames(recipes, tasks);

      _this.debug('Registering task: ' + Util.colors.green(taskName) + ' for ' + stringify(tasks));
      _this.gulp.task(taskName, function () {
        //this.log(`Running task: ${Util.colors.green(taskName)}`)
        runSequence.apply(undefined, tasks);
      });
      return _this;
    }

    babelHelpers.createClass(TaskSeries, [{
      key: 'toTaskNames',
      value: function toTaskNames(recipes, tasks) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = recipes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var recipe = _step.value;

            if (Array.isArray(recipe)) {
              var series = [];
              this.toTaskNames(recipe, series);
              tasks.push(series);
            } else {
              if (this.config.watch) {
                // if the series is a 'watch', only add 'watch' enabled recipes
                if (recipe.config.watch) {
                  tasks.push(recipe.watchTaskName());
                }
              } else {
                tasks.push(recipe.taskName());
              }
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    }]);
    return TaskSeries;
  }(Base);

  var Default$5 = {
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
  };

  var RollupEs = function (_BaseRecipe) {
    babelHelpers.inherits(RollupEs, _BaseRecipe);

    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from presets.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function RollupEs(gulp, preset) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, RollupEs);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RollupEs).call(this, gulp, preset, extend(true, {}, Default$5, config)));
      //this.browserSync = BrowserSync.create()
    }

    babelHelpers.createClass(RollupEs, [{
      key: 'resolveEntry',
      value: function resolveEntry() {
        // Resolve the source and make sure there is one entry point
        if (Array.isArray(this.config.source.glob)) {
          throw new Error('Rollup only accepts one entry point.  Found array for source.glob: ' + this.config.source.glob);
        }
        // get full path results
        this.config.source.options['realpath'] = true;

        var entry = glob.sync(this.config.source.glob, this.config.source.options);

        if (!entry || entry.length <= 0) {
          throw new Error('Unable to resolveEntry() for source: ' + stringify(this.config.source));
        }

        if (entry.length > 1) {
          throw new Error('resolveEntry() should only find one entry point but found ' + entry + ' for source: ' + stringify(this.config.source));
        }
        return entry[0];
      }
    }, {
      key: 'run',
      value: function run() {
        var _this2 = this;

        var watching = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

        var options = extend(true, {
          entry: this.resolveEntry(),
          onwarn: function onwarn(message) {
            //this.notifyError(message, watching)
            _this2.log(message);
          }
        }, this.config.options);

        if (!options.dest) {
          throw new Error('dest must be specified.');
        }

        this.debug('Executing rollup with options: ' + stringify(options));

        return rollup.rollup(options).then(function (bundle) {
          return bundle.write(options);
        }).catch(function (error) {
          error.plugin = 'rollup';
          _this2.notifyError(error, watching);
        });
      }
    }]);
    return RollupEs;
  }(BaseRecipe);

  var Default$6 = {
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
  };

  /**
   * ----------------------------------------------
   * Class Definition
   * ----------------------------------------------
   */
  var RollupCjs = function (_RollupEs) {
    babelHelpers.inherits(RollupCjs, _RollupEs);

    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from presets.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function RollupCjs(gulp, preset) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, RollupCjs);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RollupCjs).call(this, gulp, preset, extend(true, {}, Default$6, config)));
    }

    return RollupCjs;
  }(RollupEs);

  var Default$7 = {
    task: {
      name: 'rollup:iife'
    },
    options: {
      //dest: '', // required
      format: 'iife'
    }
  };

  /**
   * ----------------------------------------------
   * Class Definition
   * ----------------------------------------------
   */
  var RollupIife = function (_RollupCjs) {
    babelHelpers.inherits(RollupIife, _RollupCjs);

    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from presets.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function RollupIife(gulp, preset) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, RollupIife);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RollupIife).call(this, gulp, preset, extend(true, {}, Default$7, config)));
    }

    return RollupIife;
  }(RollupCjs);

  var Default$8 = {
    task: {
      name: 'rollup:amd'
    },
    options: {
      //dest: '', // required
      format: 'amd'
    }
  };

  /**
   * ----------------------------------------------
   * Class Definition
   * ----------------------------------------------
   */
  var RollupAmd = function (_RollupCjs) {
    babelHelpers.inherits(RollupAmd, _RollupCjs);

    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from presets.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function RollupAmd(gulp, preset) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, RollupAmd);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RollupAmd).call(this, gulp, preset, extend(true, {}, Default$8, config)));
    }

    return RollupAmd;
  }(RollupCjs);

  var Default$9 = {
    task: {
      name: 'rollup:umd'
    },
    options: {
      //dest: '', // required
      format: 'umd'
    }
  };

  /**
   * ----------------------------------------------
   * Class Definition
   * ----------------------------------------------
   */
  var RollupUmd = function (_RollupCjs) {
    babelHelpers.inherits(RollupUmd, _RollupCjs);

    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from presets.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function RollupUmd(gulp, preset) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, RollupUmd);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RollupUmd).call(this, gulp, preset, extend(true, {}, Default$9, config)));
    }

    return RollupUmd;
  }(RollupCjs);

  var Default$16 = {
    debug: false,
    watch: false,
    sync: true // necessary so that tasks can be run in a series, can be overriden for other purposes
  };

  var BaseClean = function (_BaseRecipe) {
    babelHelpers.inherits(BaseClean, _BaseRecipe);

    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from presets.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function BaseClean(gulp, preset) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, BaseClean);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(BaseClean).call(this, gulp, preset, extend(true, {}, Default$16, config)));
    }

    babelHelpers.createClass(BaseClean, [{
      key: 'run',
      value: function run() {
        var _this2 = this;

        var watching = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

        if (this.config.sync) {
          var paths = del.sync(this.config.dest);
          this.logDeleted(paths);
        } else {
          return del(this.config.dest).then(function (paths) {
            _this2.logDeleted(paths);
          }).catch(function (error) {
            error.plugin = 'del';
            _this2.notifyError(error, watching);
          });
        }
      }
    }, {
      key: 'logDeleted',
      value: function logDeleted(paths) {
        if (paths.length > 0) {
          this.log('Deleted files and folders:');
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = paths[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var path = _step.value;

              this.log('    ' + path);
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }
      }
    }]);
    return BaseClean;
  }(BaseRecipe);

  var Default$10 = {
    presetType: 'images',
    task: {
      name: 'clean:images'
    }
  };

  var CleanImages = function (_BaseClean) {
    babelHelpers.inherits(CleanImages, _BaseClean);

    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from presets.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function CleanImages(gulp, preset) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, CleanImages);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(CleanImages).call(this, gulp, preset, extend(true, {}, Default$10, config)));
    }

    return CleanImages;
  }(BaseClean);

  var Default$11 = {
    presetType: 'stylesheets',
    task: {
      name: 'clean:stylesheets'
    }
  };

  var CleanStylesheets = function (_BaseClean) {
    babelHelpers.inherits(CleanStylesheets, _BaseClean);

    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from presets.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function CleanStylesheets(gulp, preset) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, CleanStylesheets);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(CleanStylesheets).call(this, gulp, preset, extend(true, {}, Default$11, config)));
    }

    return CleanStylesheets;
  }(BaseClean);

  var Default$12 = {
    presetType: 'javascripts',
    task: {
      name: 'clean:javascripts'
    }
  };

  var CleanJavascripts = function (_BaseClean) {
    babelHelpers.inherits(CleanJavascripts, _BaseClean);

    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from presets.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function CleanJavascripts(gulp, preset) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, CleanJavascripts);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(CleanJavascripts).call(this, gulp, preset, extend(true, {}, Default$12, config)));
    }

    return CleanJavascripts;
  }(BaseClean);

  var Default$13 = {
    debug: false,
    watch: false,
    presetType: 'macro',
    task: {
      name: 'clean'
    }
  };

  var Clean = function (_BaseRecipe) {
    babelHelpers.inherits(Clean, _BaseRecipe);

    /**
     *
     * @param gulp - gulp instance
     * @param config - customized overrides
     */

    function Clean(gulp, preset) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, Clean);

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Clean).call(this, gulp, preset, extend(true, {}, Default$13, config)));

      _this.cleanImages = new CleanImages(gulp, preset);
      _this.cleanStylesheets = new CleanStylesheets(gulp, preset);
      _this.cleanJavascripts = new CleanJavascripts(gulp, preset);
      return _this;
    }

    babelHelpers.createClass(Clean, [{
      key: 'run',
      value: function run() {
        this.cleanImages.run();
        this.cleanStylesheets.run();
        this.cleanJavascripts.run();
      }
    }]);
    return Clean;
  }(BaseRecipe);

  exports.Autoprefixer = Autoprefixer;
  exports.EsLint = EsLint;
  exports.Images = Images;
  exports.Sass = Sass;
  exports.ScssLint = ScssLint;
  exports.TaskSeries = TaskSeries;
  exports.RollupEs = RollupEs;
  exports.RollupCjs = RollupCjs;
  exports.RollupIife = RollupIife;
  exports.RollupAmd = RollupAmd;
  exports.RollupUmd = RollupUmd;
  exports.CleanImages = CleanImages;
  exports.CleanStylesheets = CleanStylesheets;
  exports.CleanJavascripts = CleanJavascripts;
  exports.Clean = Clean;

}));
//# sourceMappingURL=gulp-pipeline.umd.js.map