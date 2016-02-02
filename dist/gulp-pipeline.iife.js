(function (exports,autoprefixer,extend,gulpif,eslint,debug$1,glob,BrowserSync,sass,sourcemaps,Util,scssLint,scssLintStylish,rollup,stringify,babel,notify) {
  'use strict';

  autoprefixer = 'default' in autoprefixer ? autoprefixer['default'] : autoprefixer;
  extend = 'default' in extend ? extend['default'] : extend;
  gulpif = 'default' in gulpif ? gulpif['default'] : gulpif;
  eslint = 'default' in eslint ? eslint['default'] : eslint;
  debug$1 = 'default' in debug$1 ? debug$1['default'] : debug$1;
  glob = 'default' in glob ? glob['default'] : glob;
  BrowserSync = 'default' in BrowserSync ? BrowserSync['default'] : BrowserSync;
  sass = 'default' in sass ? sass['default'] : sass;
  sourcemaps = 'default' in sourcemaps ? sourcemaps['default'] : sourcemaps;
  Util = 'default' in Util ? Util['default'] : Util;
  scssLint = 'default' in scssLint ? scssLint['default'] : scssLint;
  scssLintStylish = 'default' in scssLintStylish ? scssLintStylish['default'] : scssLintStylish;
  stringify = 'default' in stringify ? stringify['default'] : stringify;
  babel = 'default' in babel ? babel['default'] : babel;
  notify = 'default' in notify ? notify['default'] : notify;

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

  var Default$10 = {
    watch: true,
    debug: false
  };

  /**
   * ----------------------------------------------
   * Class Definition
   * ----------------------------------------------
   */
  var Base = function () {

    /**
     *
     * @param gulp - gulp instance
     * @param config - customized overrides
     */

    function Base(gulp, config) {
      babelHelpers.classCallCheck(this, Base);

      this.gulp = gulp;
      this.config = extend(true, {}, Default$10, config);
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
      key: 'notifyError',
      value: function notifyError(error) {
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
        this.gulp.emit('end');
      }
    }, {
      key: 'debugOptions',
      value: function debugOptions() {
        return { title: '[' + Util.colors.cyan('debug') + '][' + Util.colors.cyan(this.taskName()) + ']' };
      }

      // ----------------------------------------------
      // private

      // ----------------------------------------------
      // static

    }]);
    return Base;
  }();

  var Default$9 = {
    watch: true,
    debug: false
  };

  /**
   * ----------------------------------------------
   * Class Definition
   * ----------------------------------------------
   */
  var BaseRecipe = function (_Base) {
    babelHelpers.inherits(BaseRecipe, _Base);

    /**
     *
     * @param gulp - gulp instance
     * @param platform - base platform configuration - either one from platform.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function BaseRecipe(gulp, platform, config) {
      babelHelpers.classCallCheck(this, BaseRecipe);

      if (!platform) {
        throw new Error('Platform must be specified.  Please use one from the platform.js or specify a custom platform configuration.');
      }

      if (!config || !config.platformType) {
        console.log('' + stringify(config));
        throw new Error('\'platformType\' must be specified in the config (usually the Default config).  See platform.js for a list of types such as javascripts, stylesheets, etc.');
      }

      var platformTypeConfig = platform[config.platformType];
      if (!platformTypeConfig) {
        throw new Error('Unable to resolve configuration for platformType: ' + config.platformType + ' from platform: ' + stringify(platform));
      }

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(BaseRecipe).call(this, gulp, extend(true, {}, Default$9, platformTypeConfig, config)));

      if (_this.config.task) {
        // generate primary task e.g. sass
        var name = _this.taskName();
        _this.debug('Registering task: ' + Util.colors.green(name));
        _this.gulp.task(name, function () {
          _this.run();
        });
      }

      if (_this.config.watch) {
        // generate watch task e.g. sass:watch
        var name = _this.watchTaskName();
        _this.debug('Registering task: ' + Util.colors.green(name));
        _this.gulp.task(name, function () {
          _this.watch();
        });
      }
      return _this;
    }

    babelHelpers.createClass(BaseRecipe, [{
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
    }, {
      key: 'watch',
      value: function watch() {
        this.gulp.watch(this.config.source.glob, this.config.source.options, [this.taskName()]);
      }

      // ----------------------------------------------
      // protected

    }, {
      key: 'conditionalDebug',
      value: function conditionalDebug() {}
      // ----------------------------------------------
      // private

      // ----------------------------------------------
      // static

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

  /**
   * ----------------------------------------------
   * Class Definition
   * ----------------------------------------------
   */
  var Autoprefixer = function (_BaseRecipe) {
    babelHelpers.inherits(Autoprefixer, _BaseRecipe);

    /**
     *
     * @param gulp - gulp instance
     * @param platform - base platform configuration - either one from platform.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function Autoprefixer(gulp) {
      var config = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
      babelHelpers.classCallCheck(this, Autoprefixer);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Autoprefixer).call(this, gulp, extend(true, {}, AutoprefixerDefault, config)));
    }

    babelHelpers.createClass(Autoprefixer, [{
      key: 'run',
      value: function run() {
        // FIXME: is this right or wrong?  this class initially was extracted for reuse of Default options
        return this.gulp.src(this.config.source).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(autoprefixer(this.config.options)).pipe(this.gulp.dest(this.config.dest));
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

  var Default = {
    debug: true,
    platformType: 'javascripts',
    task: {
      name: 'eslint'
    },
    watch: {
      glob: '**/*.js',
      options: {
        //cwd: ** resolved from platform **
      }
    },
    source: {
      glob: '**/*.js',
      options: {
        //cwd: ** resolved from platform **
      }
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
     * @param gulp - gulp instance
     * @param platform - base platform configuration - either one from platform.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function EsLint(gulp, platform) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, EsLint);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(EsLint).call(this, gulp, platform, extend(true, {}, Default, config)));
    }

    babelHelpers.createClass(EsLint, [{
      key: 'run',
      value: function run() {

        // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
        var bundle = this.gulp.src(this.config.source.glob, this.config.source.options).pipe(gulpif(this.config.debug, debug$1(this.debugOptions()))).pipe(eslint(this.config.options)).pipe(eslint.format()) // outputs the lint results to the console. Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.failAfterError()); // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.

        // FIXME: even including any remnant of JSCS at this point broke everything through the unfound requirement of babel 5.x through babel-jscs.  I can't tell where this occurred, but omitting gulp-jscs for now gets me past this issue.  Revisit this when there are clear updates to use babel 6
        //.pipe(jscs())      // enforce style guide
        //.pipe(stylish())  // log style errors
        //.pipe(jscs.reporter('fail')) // fail on error

        return bundle;
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

  var Default$1 = {
    debug: true,
    platformType: 'stylesheets',
    task: {
      name: 'sass'
    },
    watch: {
      glob: '**/*.scss',
      options: {
        //cwd: ** resolved from platform **
      }
    },
    source: {
      glob: ['*.scss', '!_*.scss'],
      options: {
        //cwd: ** resolved from platform **
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

  /**
   * ----------------------------------------------
   * Class Definition
   * ----------------------------------------------
   */
  var Sass = function (_BaseRecipe) {
    babelHelpers.inherits(Sass, _BaseRecipe);

    /**
     *
     * @param gulp - gulp instance
     * @param platform - base platform configuration - either one from platform.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function Sass(gulp, platform) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, Sass);

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Sass).call(this, gulp, platform, extend(true, {}, Default$1, config)));

      _this.browserSync = BrowserSync.create();
      return _this;
    }

    babelHelpers.createClass(Sass, [{
      key: 'run',
      value: function run() {
        var _this2 = this;

        var bundle = this.gulp.src(this.config.source.glob, this.config.source.options).pipe(gulpif(this.config.debug, debug$1(this.debugOptions()))).pipe(sourcemaps.init()).pipe(sass(this.config.options)).on('error', function (error) {
          _this2.notifyError(error);
        }).pipe(autoprefixer(this.config.autoprefixer.options)).pipe(sourcemaps.write()).pipe(this.gulp.dest(this.config.dest)).pipe(this.browserSync.stream());

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

  var Default$2 = {
    debug: true,
    platformType: 'stylesheets',
    task: {
      name: 'scsslint'
    },
    watch: {
      glob: '**/*.scss',
      options: {
        //cwd: ** resolved from platform **
      }
    },
    source: {
      glob: '**/*.scss',
      options: {
        //cwd: ** resolved from platform **
      }
    },
    options: {
      customReport: scssLintStylish
    }
  };

  /**
   * ----------------------------------------------
   * Class Definition
   * ----------------------------------------------
   */
  var ScssLint = function (_BaseRecipe) {
    babelHelpers.inherits(ScssLint, _BaseRecipe);

    /**
     *
     * @param gulp - gulp instance
     * @param platform - base platform configuration - either one from platform.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function ScssLint(gulp, platform) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, ScssLint);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(ScssLint).call(this, gulp, platform, extend(true, {}, Default$2, config)));
    }

    babelHelpers.createClass(ScssLint, [{
      key: 'run',
      value: function run() {
        return this.gulp.src(this.config.source.glob, this.config.source.options).pipe(gulpif(this.config.debug, debug$1(this.debugOptions()))).pipe(scssLint(this.config.options));
      }

      // ----------------------------------------------
      // protected

      // ----------------------------------------------
      // private

      // ----------------------------------------------
      // static

    }]);
    return ScssLint;
  }(BaseRecipe);

  var Default$3 = {
    watch: false
  };

  /**
   * ----------------------------------------------
   * Class Definition
   * ----------------------------------------------
   */
  var TaskSequence = function (_Base) {
    babelHelpers.inherits(TaskSequence, _Base);

    /**
     *
     * @param gulp - gulp instance
     * @param config - customized overrides
     */

    function TaskSequence(gulp, taskName, recipes) {
      var config = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];
      babelHelpers.classCallCheck(this, TaskSequence);

      // generate the task sequence

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(TaskSequence).call(this, gulp, extend(true, {}, Default$3, config)));

      var tasks = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = recipes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var recipe = _step.value;

          if (_this.config.watch) {
            tasks.push(recipe.watchTaskName());
          } else {
            tasks.push(recipe.taskName());
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

      _this.debug('Registering task: ' + Util.colors.green(taskName));
      _this.gulp.task(taskName, tasks);
      return _this;
    }

    // ----------------------------------------------
    // protected

    // ----------------------------------------------
    // private

    // ----------------------------------------------
    // static

    return TaskSequence;
  }(Base);

  var Default$4 = {
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
  };

  /**
   * ----------------------------------------------
   * Class Definition
   * ----------------------------------------------
   */
  var RollupEs = function (_BaseRecipe) {
    babelHelpers.inherits(RollupEs, _BaseRecipe);

    /**
     *
     * @param gulp - gulp instance
     * @param platform - base platform configuration - either one from platform.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function RollupEs(gulp, platform) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, RollupEs);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RollupEs).call(this, gulp, platform, extend(true, {}, Default$4, config)));
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

        var options = extend(true, {
          entry: this.resolveEntry(),
          //onwarn: (message) => this.onwarn(message)
          onwarn: function onwarn(message) {
            console.error(message);
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
          _this2.notifyError(error);
        });
      }

      // ----------------------------------------------
      // protected

      // ----------------------------------------------
      // private

      // ----------------------------------------------
      // static

    }]);
    return RollupEs;
  }(BaseRecipe);

  var Default$5 = {
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
     * @param platform - base platform configuration - either one from platform.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function RollupCjs(gulp, platform) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, RollupCjs);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RollupCjs).call(this, gulp, platform, extend(true, {}, Default$5, config)));
    }

    return RollupCjs;
  }(RollupEs);

  var Default$6 = {
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
     * @param platform - base platform configuration - either one from platform.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function RollupIife(gulp, platform) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, RollupIife);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RollupIife).call(this, gulp, platform, extend(true, {}, Default$6, config)));
    }

    return RollupIife;
  }(RollupCjs);

  var Default$7 = {
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
     * @param platform - base platform configuration - either one from platform.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function RollupAmd(gulp, platform) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, RollupAmd);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RollupAmd).call(this, gulp, platform, extend(true, {}, Default$7, config)));
    }

    return RollupAmd;
  }(RollupCjs);

  var Default$8 = {
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
     * @param platform - base platform configuration - either one from platform.js or a custom hash
     * @param config - customized overrides for this recipe
     */

    function RollupUmd(gulp, platform) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, RollupUmd);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RollupUmd).call(this, gulp, platform, extend(true, {}, Default$8, config)));
    }

    return RollupUmd;
  }(RollupCjs);

  exports.Autoprefixer = Autoprefixer;
  exports.EsLint = EsLint;
  exports.Sass = Sass;
  exports.ScssLint = ScssLint;
  exports.TaskSequence = TaskSequence;
  exports.RollupEs = RollupEs;
  exports.RollupCjs = RollupCjs;
  exports.RollupIife = RollupIife;
  exports.RollupAmd = RollupAmd;
  exports.RollupUmd = RollupUmd;

}((this.gulpPipeline = {}),autoprefixer,extend,gulpif,eslint,debug$1,glob,BrowserSync,sass,sourcemaps,Util,scssLint,scssLintStylish,rollup,stringify,babel,notify));
//# sourceMappingURL=gulp-pipeline.iife.js.map