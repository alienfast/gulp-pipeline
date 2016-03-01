'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var extend = _interopDefault(require('extend'));
var path = _interopDefault(require('path'));
var glob = _interopDefault(require('glob'));
var spawn = _interopDefault(require('cross-spawn'));
var fs = _interopDefault(require('fs'));
var jsonfile = _interopDefault(require('jsonfile'));
var Util = _interopDefault(require('gulp-util'));
var stringify = _interopDefault(require('stringify-object'));
var notify = _interopDefault(require('gulp-notify'));
var gulpHelp = _interopDefault(require('gulp-help'));
var console = _interopDefault(require('console'));
var autoprefixer = _interopDefault(require('gulp-autoprefixer'));
var gulpif = _interopDefault(require('gulp-if'));
var debug = _interopDefault(require('gulp-debug'));
var eslint = _interopDefault(require('gulp-eslint'));
var BrowserSync = _interopDefault(require('browser-sync'));
var changed = _interopDefault(require('gulp-changed'));
var imagemin = _interopDefault(require('gulp-imagemin'));
var merge = _interopDefault(require('merge-stream'));
var sass = _interopDefault(require('gulp-sass'));
var sourcemaps = _interopDefault(require('gulp-sourcemaps'));
var findup = _interopDefault(require('findup-sync'));
var scssLint = _interopDefault(require('gulp-scss-lint'));
var scssLintStylish = _interopDefault(require('gulp-scss-lint-stylish'));
var rollup = require('rollup');
var nodeResolve = _interopDefault(require('rollup-plugin-node-resolve'));
var commonjs = _interopDefault(require('rollup-plugin-commonjs'));
var process = _interopDefault(require('process'));
var babel = _interopDefault(require('rollup-plugin-babel'));
var del = _interopDefault(require('del'));
var rev = _interopDefault(require('gulp-rev'));
var cssnano = _interopDefault(require('gulp-cssnano'));
var mocha = _interopDefault(require('gulp-mocha'));
var BuildControl = _interopDefault(require('build-control/src/buildControl'));
var fs$1 = _interopDefault(require('fs-extra'));
var pathIsAbsolute = _interopDefault(require('path-is-absolute'));

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

babelHelpers.toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

babelHelpers;

var BaseDirectoriesCache = '.gulp-pipeline-rails.json';
var GemfileLock = 'Gemfile.lock';

var Rails = function () {
  function Rails() {
    babelHelpers.classCallCheck(this, Rails);
  }

  babelHelpers.createClass(Rails, null, [{
    key: 'enumerateEngines',
    value: function enumerateEngines() {

      var results = spawn.sync(this.localPath('railsRunner.sh'), [this.localPath('enumerateEngines.rb')], {
        sdtio: 'inherit',
        cwd: this.railsAppCwd()
      });

      //Util.log(stringify(results))
      if (results.stderr != '' || results.error != null) {
        Util.log(stringify(results));

        var msg = '';
        if (results.stderr) {
          msg += results.stderr;
        }
        if (results.error) {
          msg += results.error;
        }
        // message will be either error or stderr, so just grap both of them
        throw new Error('Ruby script error: \n' + results.stderr + results.error);
      }
      return JSON.parse(results.stdout);
    }

    /**
     * We need a rails app to run our rails script runner.  Since this project could be a rails engine, find a rails app somewhere in or under the cwd.
     */

  }, {
    key: 'railsAppCwd',
    value: function railsAppCwd() {
      var entries = glob.sync('**/bin/rails', { realpath: true });
      if (!entries || entries.length <= 0) {
        throw new Error('Unable to find Rails application directory based on existence of \'bin/rails\'');
      }

      if (entries.length > 1) {
        throw new Error('railsAppCwd() should only find one rails application but found ' + entries);
      }
      return path.join(entries[0], '../..');
    }
  }, {
    key: 'localPath',
    value: function localPath(name) {
      var filename = 'rails/' + name;

      // if using source dir
      var filepath = filepath = path.join(__dirname, filename); // eslint-disable-line no-undef
      try {
        fs.statSync(filepath);
      } catch (error) {
        // if using dist dir
        filepath = path.join(__dirname, '../src', filename); // eslint-disable-line no-undef
        fs.statSync(filepath);
      }

      return filepath;
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

  }, {
    key: 'baseDirectories',
    value: function baseDirectories() {
      if (!this.changed(GemfileLock, BaseDirectoriesCache)) {
        return jsonfile.readFileSync(BaseDirectoriesCache);
      } else {
        Util.log('Generating baseDirectories cache...');
        try {
          fs.unlinkSync(BaseDirectoriesCache);
        } catch (error) {
          //ignore
        }

        Util.log('Enumerating rails engines...');
        var engines = Rails.enumerateEngines();
        //console.log(stringify(engines))

        var baseDirectories = ['./'];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = Object.keys(engines)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var key = _step.value;

            baseDirectories.push(engines[key]);
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

        Util.log('Writing baseDirectories cache...');
        var result = { baseDirectories: baseDirectories };
        jsonfile.writeFileSync(BaseDirectoriesCache, result, { spaces: 2 });
        return result;
      }
    }
  }, {
    key: 'changed',
    value: function changed(sourceFileName, targetFileName) {
      var sourceStat = null;
      var targetStat = null;
      try {
        sourceStat = fs.statSync(sourceFileName);
        targetStat = fs.statSync(targetFileName);
      } catch (error) {
        return true;
      }

      if (sourceStat.mtime > targetStat.mtime) {
        return true;
      } else {
        return false;
      }
    }
  }]);
  return Rails;
}();

//import Util from 'gulp-util'

// NOTE: `source` and `watch` are node-glob options hashes. e.g. gulp.src(source.glob, source.options)

// Baseline is the simplest possible.  Take caution in modifying this one or make sure your platform preset overrides everything necessary.
var Baseline = {
  javascripts: {
    source: {
      glob: 'index.js',
      options: { cwd: 'src' },
      all: '**/*.js'
    },
    test: {
      glob: '**/*.js',
      options: { cwd: 'test' }
    },
    watch: {
      glob: '**/*.js',
      options: { cwd: 'src' }
    },
    dest: 'dist'
  },
  stylesheets: {
    source: {
      glob: ['*.scss', '!_*.scss'], // do not compile all files, only non-underscored files
      options: { cwd: 'src' },
      all: '**/*.scss'
    },
    watch: {
      glob: '**/*.scss',
      options: { cwd: 'src' }
    },
    dest: 'dist'
  },
  images: {
    source: { options: { cwd: 'images' } },
    watch: { options: { cwd: 'images' } },
    dest: 'dist'
  },
  digest: {
    source: { options: { cwd: 'dist' } },
    watch: { options: { cwd: 'dist' } },
    dest: 'dist/digest'
  }
};

var PresetNodeSrc = {};

var PresetNodeLib = {
  javascripts: {
    source: {
      options: { cwd: 'lib' }
    },
    watch: { options: { cwd: 'lib' } }
  },
  stylesheets: {
    source: { options: { cwd: 'lib' } },
    watch: { options: { cwd: 'lib' } }
  },
  images: {
    source: { options: { cwd: 'lib' } },
    watch: { options: { cwd: 'lib' } }
  }
};

// Rails, the oddball from a structure consideration
var railsJs = 'app/assets/javascripts';
var railsSs = 'app/assets/stylesheets';
var railsImages = 'app/assets/images';
var railsDest = 'public/assets/debug';
var PresetRails = {
  javascripts: {
    source: {
      glob: 'application.js',
      options: { cwd: railsJs }
    },
    watch: { options: { cwd: railsJs } },
    dest: railsDest
  },
  stylesheets: {
    source: { options: { cwd: railsSs } },
    watch: { options: { cwd: railsSs } },
    dest: railsDest
  },
  images: {
    source: { options: { cwd: railsImages } },
    watch: { options: { cwd: railsImages } },
    dest: railsDest
  },
  digest: {
    source: { options: { cwd: railsDest } },
    watch: { options: { cwd: railsDest } },
    dest: 'public/assets/digest'
  }
};

var Preset = function () {
  function Preset() {
    babelHelpers.classCallCheck(this, Preset);
  }

  babelHelpers.createClass(Preset, null, [{
    key: 'nodeLib',
    value: function nodeLib() {
      var overrides = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return extend(true, {}, Baseline, PresetNodeLib, overrides);
    }
  }, {
    key: 'nodeSrc',
    value: function nodeSrc() {
      var overrides = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return extend(true, {}, Baseline, PresetNodeSrc, overrides);
    }
  }, {
    key: 'rails',
    value: function rails() {
      var overrides = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];


      return extend(true, {}, Baseline, PresetRails, Rails.baseDirectories(), overrides);
    }

    /**
     * Helper to quickly resolve the config from preset based on the presetType
     *
     * @param preset
     * @param configs - ordered set of overrides
     * @returns {source, watch, dest}
     */

  }, {
    key: 'resolveConfig',
    value: function resolveConfig(preset) {
      if (!preset) {
        throw new Error('Preset must be specified.  Please use one from the preset.js or specify a custom preset configuration.');
      }

      for (var _len = arguments.length, configs = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        configs[_key - 1] = arguments[_key];
      }

      var configOverrides = extend.apply(undefined, [true, {}].concat(configs));
      //Util.log(`config before typeConfig: \n${stringify(configOverrides)}`)

      if (!configOverrides || !configOverrides.presetType) {
        throw new Error('presetType must be specified in the config (usually the Default config).  See preset.js for a list of types such as javascripts, stylesheets, etc.');
      }

      var typeConfig = null;
      if (configOverrides.presetType !== 'macro') {
        typeConfig = preset[configOverrides.presetType];
        if (!typeConfig) {
          throw new Error('Unable to resolve configuration for presetType: ' + configOverrides.presetType + ' from preset: ' + stringify(preset));
        }
      } else {
        typeConfig = {};
      }

      // now that we've determined the typeConfig, overlay the overrides
      var resolved = extend(true, {}, typeConfig, configOverrides);

      //Util.log(`resolved config with preset: \n${stringify(resolved)}`)
      return resolved;
    }
  }]);
  return Preset;
}();

var Default$1 = {
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

    this.gulp = gulpHelp(gulp, { afterPrintCallback: function afterPrintCallback() {
        return console.log('For configuration help see https://github.com/alienfast/gulp-pipeline \n');
      } }); // eslint-disable-line no-console
    this.config = extend(true, {}, Default$1, config);
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
        this.log('[' + Util.colors.cyan('debug') + '][' + Util.colors.cyan(this.constructor.name) + '] ' + msg);
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
      var taskName = error.task || this.taskName();

      notify({
        title: 'Task [' + taskName + '] Failed in [' + error.plugin + ']',
        message: lineNumber + 'See console.',
        sound: 'Sosumi' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
      }).write(error);

      var tag = Util.colors.black.bgRed;
      var report = '\n\n' + tag('    Task:') + ' [' + Util.colors.cyan(taskName) + ']\n' + tag('  Plugin:') + ' [' + error.plugin + ']\n' + tag('   Error:') + '\n' + error.message;

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

var Default = {
  watch: true,
  debug: false,
  task: {
    help: ''
  }
};

var BaseRecipe = function (_Base) {
  babelHelpers.inherits(BaseRecipe, _Base);


  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function BaseRecipe(gulp, preset, config) {
    babelHelpers.classCallCheck(this, BaseRecipe);


    // in case someone needs to inspect it later i.e. buildControl

    var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(BaseRecipe).call(this, gulp, extend(true, {}, Default, { baseDirectories: preset.baseDirectories }, Preset.resolveConfig(preset, config))));

    _this.preset = preset;

    if (_this.createHelpText !== undefined) {
      _this.config.task.help = _this.createHelpText();
    }
    _this.registerTask();
    _this.registerWatchTask();
    return _this;
  }

  //createHelpText(){
  //  // empty implementation that can dynamically create help text instead of the static config.task.help
  //}

  babelHelpers.createClass(BaseRecipe, [{
    key: 'registerWatchTask',
    value: function registerWatchTask() {
      var _this2 = this;

      if (this.config.watch) {
        (function () {
          // generate watch task e.g. sass:watch
          var name = _this2.watchTaskName();
          _this2.debug('Registering task: ' + Util.colors.green(name));
          _this2.gulp.task(name, _this2.createWatchHelpText(), function () {
            _this2.log('[' + Util.colors.green(name) + '] watching ' + _this2.config.watch.glob + ' ' + stringify(_this2.config.watch.options) + '...');

            return _this2.gulp.watch(_this2.config.watch.glob, _this2.config.watch.options, function (event) {
              _this2.log('File ' + event.path + ' was ' + event.type + ', running ' + _this2.taskName() + '...');
              return Promise.resolve(_this2.run(true)).then(function () {
                return _this2.logFinish();
              });
            });
          });
        })();
      }
    }
  }, {
    key: 'createWatchHelpText',
    value: function createWatchHelpText() {
      return Util.colors.grey('|___ watches ' + this.config.watch.options.cwd + '/' + this.config.watch.glob);
    }
  }, {
    key: 'registerTask',
    value: function registerTask() {
      var _this3 = this;

      if (this.config.task) {
        (function () {
          // generate primary task e.g. sass
          var name = _this3.taskName();
          _this3.debug('Registering task: ' + Util.colors.green(name));
          _this3.gulp.task(name, _this3.config.task.help, function () {
            //this.log(`Running task: ${Util.colors.green(name)}`)

            if (_this3.config.debug) {
              _this3.debugDump('Executing ' + Util.colors.green(name) + ' with options:', _this3.config.options);
            }
            return _this3.run();
          });
        })();
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
  }, {
    key: 'logFinish',
    value: function logFinish() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? 'finished.' : arguments[0];

      this.log('[' + Util.colors.green(this.taskName()) + '] ' + message);
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
   * @param preset - base preset configuration - either one from preset.js or a custom hash
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

var Default$2 = {
  debug: false,
  presetType: 'javascripts',
  task: {
    name: 'eslint'
  },
  source: {
    glob: '**/*.js'
  },
  options: {}
};

var EsLint = function (_BaseRecipe) {
  babelHelpers.inherits(EsLint, _BaseRecipe);


  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function EsLint(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, EsLint);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(EsLint).call(this, gulp, preset, extend(true, {}, Default$2, config)));
  }

  babelHelpers.createClass(EsLint, [{
    key: 'createHelpText',
    value: function createHelpText() {
      return 'Lints ' + this.config.source.options.cwd + '/' + this.config.source.glob;
    }
  }, {
    key: 'run',
    value: function run() {
      var _this2 = this;

      var watching = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

      // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
      var bundle = this.gulp.src(this.config.source.glob, this.config.source.options).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(eslint(this.config.options)).pipe(eslint.format()) // outputs the lint results to the console. Alternatively use eslint.formatEach() (see Docs).

      //1. HACK solution that works with first error, but is very ugly
      // this should emit the error, but we aren't notified
      .pipe(gulpif(!watching, eslint.failAfterError())) // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.

      // make sure we are notified of any error (this really should be happening in eslint.failAfterError(), but not sure where it is lost)
      .pipe(eslint.result(function (results) {
        // this is single file #result not #results, we don't get notified on #results
        var count = results.errorCount;
        if (count > 0) {
          throw new Util.PluginError('gulp-eslint', {
            message: 'Failed with' + (count === 1 ? ' error' : ' errors')
          });
        }
      })).on('error', function (error) {
        _this2.notifyError(error, watching);
      });

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

      return bundle;
    }
  }]);
  return EsLint;
}(BaseRecipe);

var Default$3 = {
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
};

var Images = function (_BaseRecipe) {
  babelHelpers.inherits(Images, _BaseRecipe);


  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function Images(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, Images);

    var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Images).call(this, gulp, preset, extend(true, {}, Default$3, config)));

    _this.browserSync = BrowserSync.create();
    return _this;
  }

  babelHelpers.createClass(Images, [{
    key: 'createHelpText',
    value: function createHelpText() {
      return 'Minifies change images from ' + this.config.source.options.cwd + '/' + this.config.source.glob;
    }
  }, {
    key: 'run',
    value: function run() {
      var _this2 = this;

      var watching = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];


      var tasks = this.config.baseDirectories.map(function (baseDirectory) {
        // join the base dir with the relative cwd
        return _this2.runOne(path.join(baseDirectory, _this2.config.source.options.cwd), watching);
      });
      return merge(tasks);
    }
  }, {
    key: 'runOne',
    value: function runOne(cwd, watching) {
      var _this3 = this;

      // setup a run with a single cwd a.k.a base directory FIXME: perhaps this could be in the base recipe? or not?
      var options = extend({}, this.config.source.options);
      options.cwd = cwd;
      this.debug('src: ' + cwd + '/' + this.config.source.glob);

      return this.gulp.src(this.config.source.glob, options).pipe(changed(this.config.dest)) // ignore unchanged files
      .pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(imagemin(this.config.options)).on('error', function (error) {
        _this3.notifyError(error, watching);
      }).pipe(this.gulp.dest(this.config.dest)).pipe(this.browserSync.stream());
    }
  }]);
  return Images;
}(BaseRecipe);

var node_modules = findup('node_modules');

var Default$4 = {
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
};

var Sass = function (_BaseRecipe) {
  babelHelpers.inherits(Sass, _BaseRecipe);


  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function Sass(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, Sass);

    var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Sass).call(this, gulp, preset, extend(true, {}, Default$4, config)));

    _this.browserSync = BrowserSync.create();
    return _this;
  }

  babelHelpers.createClass(Sass, [{
    key: 'createHelpText',
    value: function createHelpText() {
      return 'Compiles ' + this.config.source.options.cwd + '/' + this.config.source.glob;
    }
  }, {
    key: 'run',
    value: function run() {
      var _this2 = this;

      var watching = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

      // add debug for importing problems (can be very helpful)
      if (this.config.debug && this.config.options.importer === undefined) {
        this.config.options.importer = function (url, prev, done) {
          _this2.debug('importing ' + url + ' from ' + prev);
          done({ file: url });
        };
      }

      return this.gulp.src(this.config.source.glob, this.config.source.options).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(sourcemaps.init()).pipe(sass(this.config.options)).on('error', function (error) {
        _this2.notifyError(error, watching);
      }).pipe(autoprefixer(this.config.autoprefixer.options)).pipe(sourcemaps.write()).pipe(this.gulp.dest(this.config.dest)).pipe(this.browserSync.stream());
    }
  }]);
  return Sass;
}(BaseRecipe);

var Default$5 = {
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
};

var ScssLint = function (_BaseRecipe) {
  babelHelpers.inherits(ScssLint, _BaseRecipe);


  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function ScssLint(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, ScssLint);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(ScssLint).call(this, gulp, preset, extend(true, {}, Default$5, config)));
  }

  babelHelpers.createClass(ScssLint, [{
    key: 'createHelpText',
    value: function createHelpText() {
      return 'Lints ' + this.config.source.options.cwd + '/' + this.config.source.glob;
    }
  }, {
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

var Default$6 = {
  debug: false,
  watch: true // register a watch task that aggregates all watches and runs the full sequence
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

    var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(TaskSeries).call(this, gulp, extend(true, {}, Default$6, config)));

    _this.recipes = recipes;
    _this.registerTask(taskName, recipes);

    if (_this.config.watch) {
      _this.registerWatchTask(taskName + ':watch', recipes);
    }
    return _this;
  }

  babelHelpers.createClass(TaskSeries, [{
    key: 'createHelpText',
    value: function createHelpText() {
      var taskNames = this.flattenedRecipes().reduce(function (a, b) {
        return a.concat(b.taskName());
      }, []);

      // use the config to generate the dynamic help
      return 'Runs series [' + taskNames.join(', ') + ']';
    }
  }, {
    key: 'createWatchHelpText',
    value: function createWatchHelpText() {
      var taskNames = this.watchableRecipes().reduce(function (a, b) {
        return a.concat(b.taskName());
      }, []);

      return Util.colors.grey('|___ aggregates watches from [' + taskNames.join(', ') + '] and runs full series');
    }
  }, {
    key: 'registerTask',
    value: function registerTask(taskName) {
      var _this2 = this;

      var tasks = this.toTaskNames(this.recipes);

      this.debugDump('this.recipes', this.recipes);
      this.debugDump('tasks', tasks);

      this.debug('Registering task: ' + Util.colors.green(taskName) + ' for ' + stringify(tasks));
      this.gulp.task(taskName, this.createHelpText(), function () {
        return _this2.run(tasks);
      });
    }
  }, {
    key: 'flattenedRecipes',
    value: function flattenedRecipes() {
      var _ref;

      var recipes = (_ref = []).concat.apply(_ref, babelHelpers.toConsumableArray(this.recipes));
      //this.debugDump(`flattenedRecipes`, recipes)
      return recipes;
    }
  }, {
    key: 'watchableRecipes',
    value: function watchableRecipes() {
      // create an array of watchable recipes
      var watchableRecipes = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.flattenedRecipes()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var recipe = _step.value;

          if (recipe.config.watch) {
            watchableRecipes.push(recipe);
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

      return watchableRecipes;
    }
  }, {
    key: 'registerWatchTask',
    value: function registerWatchTask(taskName, recipes) {
      var _this3 = this;

      // generate watch task
      var watchableRecipes = this.watchableRecipes();
      if (watchableRecipes.length < 1) {
        this.debug('No watchable recipes for task: ' + Util.colors.green(taskName));
        return;
      }

      this.debug('Registering task: ' + Util.colors.green(taskName));
      this.gulp.task(taskName, this.createWatchHelpText(), function () {

        // watch the watchable recipes and make them #run the series
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = watchableRecipes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var recipe = _step2.value;

            _this3.log('[' + Util.colors.green(taskName) + '] watching ' + recipe.taskName() + ' ' + recipe.config.watch.glob + '...');
            _this3.gulp.watch(recipe.config.watch.glob, recipe.config.watch.options, function (event) {
              _this3.log('[' + Util.colors.green(taskName) + '] ' + event.path + ' was ' + event.type + ', running series...');
              return Promise.resolve(_this3.run(recipes)).then(function () {
                return _this3.log('[' + Util.colors.green(taskName) + '] finished');
              });
            });
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      });
    }
  }, {
    key: 'run',
    value: function run(tasks) {
      // generate the task sequence
      return this.runSequence.apply(this, babelHelpers.toConsumableArray(tasks));
    }
  }, {
    key: 'toTaskNames',
    value: function toTaskNames(recipes) {
      var tasks = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      //this.debugDump(`toTaskNames`, recipes)
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = recipes[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var recipe = _step3.value;

          //this.debugDump(`recipe taskName[${recipe.taskName? recipe.taskName() : ''}] isArray[${Array.isArray(recipe)}]`, recipe)
          if (Array.isArray(recipe)) {
            tasks.push(this.toTaskNames(recipe, []));
          } else {
            this.debug('Adding to list ' + recipe.taskName());
            tasks.push(recipe.taskName());
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      return tasks;
    }

    // -----------------------------------
    // originally run-sequence code https://github.com/OverZealous/run-sequence
    // Copyright (c) 2014 [Phil DeJarnett](http://overzealous.com)
    // - Will be unnecessary with gulp 4.0
    // - Forced to include this/modify it as the #use(gulp) binding of the gulp instance didn't work with es class approach

  }, {
    key: 'runSequence',
    value: function runSequence() {
      var _this4 = this;

      for (var _len = arguments.length, taskSets = Array(_len), _key = 0; _key < _len; _key++) {
        taskSets[_key] = arguments[_key];
      }

      this.callBack = typeof taskSets[taskSets.length - 1] === 'function' ? taskSets.pop() : false;
      this.debug('currentTaskSet = null');
      this.currentTaskSet = null;
      this.verifyTaskSets(taskSets);
      this.taskSets = taskSets;

      this.onEnd = function (e) {
        return _this4.onTaskEnd(e);
      };
      this.onErr = function (e) {
        return _this4.onError(e);
      };

      this.gulp.on('task_stop', this.onEnd);
      this.gulp.on('task_err', this.onErr);

      this.runNextSet();
    }
  }, {
    key: 'finish',
    value: function finish(e) {
      this.debugDump('finish', e);
      this.gulp.removeListener('task_stop', this.onEnd);
      this.gulp.removeListener('task_err', this.onErr);

      var error = null;
      if (e && e.err) {
        this.debugDump('finish e', e);
        //error = new Util.PluginError('run-sequence', {
        //  message: `An error occured in task [${e.task}].`
        //})
        error = {
          task: e.task,
          message: e.err,
          plugin: e.plugin || ''
        };
      }

      if (this.callback) {
        this.callback(error);
      } else if (error) {
        //this.log(Util.colors.red(error.toString()))
        this.notifyError(error);
      }
    }
  }, {
    key: 'onError',
    value: function onError(err) {
      this.debugDump('onError', err);
      this.finish(err);
    }
  }, {
    key: 'onTaskEnd',
    value: function onTaskEnd(event) {
      this.debugDump('onTaskEnd', event);
      //this.debugDump(`this.currentTaskSet`, this.currentTaskSet)

      var i = this.currentTaskSet.indexOf(event.task);
      if (i > -1) {
        this.currentTaskSet.splice(i, 1);
      }
      if (this.currentTaskSet.length === 0) {
        this.runNextSet();
      }
    }
  }, {
    key: 'runNextSet',
    value: function runNextSet() {
      if (this.taskSets.length) {
        var command = this.taskSets.shift();
        if (!Array.isArray(command)) {
          command = [command];
        }
        this.debug('currentTaskSet = ' + command);
        this.currentTaskSet = command;
        this.gulp.start(command);
      } else {
        this.finish();
      }
    }
  }, {
    key: 'verifyTaskSets',
    value: function verifyTaskSets(taskSets, skipArrays) {
      var foundTasks = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];


      this.debug('verifyTaskSets: ' + stringify(taskSets));

      if (taskSets.length === 0) {
        throw new Error('No tasks were provided to run-sequence');
      }

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = taskSets[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var t = _step4.value;

          var isTask = typeof t === "string";
          var isArray = !skipArrays && Array.isArray(t);

          if (!isTask && !isArray) {
            throw new Error('Task ' + t + ' is not a valid task string.');
          }

          if (isTask && !this.gulp.hasTask(t)) {
            throw new Error('Task ' + t + ' is not configured as a task on gulp.');
          }

          if (skipArrays && isTask) {
            if (foundTasks[t]) {
              throw new Error('Task ' + t + ' is listed more than once. This is probably a typo.');
            }
            foundTasks[t] = true;
          }

          if (isArray) {
            if (t.length === 0) {
              throw new Error('An empty array was provided as a task set');
            }
            this.verifyTaskSets(t, true, foundTasks);
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }]);
  return TaskSeries;
}(Base);

var node_modules$1 = findup('node_modules');

var Default$7 = {
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
};

// This nodeResolve configuration is not used unless it is within the plugins: [nodeResolve(this.config.nodeResolve.options)] - pass this.config.nodeResolve.enabled == true in config to enable default options
var NodeResolve = {
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
};

var CommonJs = {
  commonjs: {
    enabled: false,
    options: {
      include: node_modules$1 + '/**',
      //exclude: [ `${node_modules}/foo/**', `${node_modules}/bar/**` ],

      // search for files other than .js files (must already be transpiled by a previous plugin!)
      extensions: ['.js'] // defaults to [ '.js' ]
    }
  }
};

var RollupEs = function (_BaseRecipe) {
  babelHelpers.inherits(RollupEs, _BaseRecipe);


  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function RollupEs(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, RollupEs);


    if (!config.options.dest) {
      throw new Error('options.dest filename must be specified.');
    }

    // Utilize the presets to get the dest cwd/base directory, then add the remaining passed-in file path/name

    var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RollupEs).call(this, gulp, preset, extend(true, {}, Default$7, NodeResolve, CommonJs, config)));

    _this.config.options.dest = _this.config.dest + '/' + _this.config.options.dest;

    //----------------------------------------------
    // plugins order: nodeResolve, commonjs, babel

    // Add commonjs before babel
    if (_this.config.commonjs.enabled) {
      _this.debug('Adding commonjs plugin');
      // add at the beginning
      _this.config.options.plugins.unshift(commonjs(_this.config.commonjs.options));
    }

    // Add nodeResolve before (commonjs &&|| babel)
    if (_this.config.nodeResolve.enabled) {
      _this.debug('Adding nodeResolve plugin');
      // add at the beginning
      _this.config.options.plugins.unshift(nodeResolve(_this.config.nodeResolve.options));
    }

    //this.browserSync = BrowserSync.create()
    return _this;
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
        throw new Error('Unable to resolveEntry() for source: ' + stringify(this.config.source) + ' from ' + process.cwd());
      }

      if (entry.length > 1) {
        throw new Error('resolveEntry() should only find one entry point but found ' + entry + ' for source: ' + stringify(this.config.source));
      }
      return entry[0];
    }
  }, {
    key: 'createHelpText',
    value: function createHelpText() {
      return 'Rollup ' + this.config.source.options.cwd + '/' + this.config.source.glob + ' in the ' + this.config.options.format + ' format to ' + this.config.options.dest;
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

      if (this.config.debug) {
        var prunedOptions = extend(true, {}, options);
        prunedOptions.plugins = '[ (count: ' + this.config.options.plugins.length + ') ]';
        this.debug('Executing rollup with options: ' + stringify(prunedOptions));
      }

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

var Default$8 = {
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
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function RollupCjs(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, RollupCjs);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RollupCjs).call(this, gulp, preset, extend(true, {}, Default$8, config)));
  }

  return RollupCjs;
}(RollupEs);

var Default$9 = {
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
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function RollupIife(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, RollupIife);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RollupIife).call(this, gulp, preset, extend(true, {}, Default$9, config)));
  }

  return RollupIife;
}(RollupCjs);

var Default$10 = {
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
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function RollupAmd(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, RollupAmd);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RollupAmd).call(this, gulp, preset, extend(true, {}, Default$10, config)));
  }

  return RollupAmd;
}(RollupCjs);

var Default$11 = {
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
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function RollupUmd(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, RollupUmd);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RollupUmd).call(this, gulp, preset, extend(true, {}, Default$11, config)));
  }

  return RollupUmd;
}(RollupCjs);

var Default$13 = {
  debug: false,
  watch: false,
  sync: true // necessary so that tasks can be run in a series, can be overriden for other purposes
};

var BaseClean = function (_BaseRecipe) {
  babelHelpers.inherits(BaseClean, _BaseRecipe);


  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function BaseClean(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, BaseClean);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(BaseClean).call(this, gulp, preset, extend(true, {}, Default$13, config)));
  }

  babelHelpers.createClass(BaseClean, [{
    key: 'createHelpText',
    value: function createHelpText() {
      // use the config to generate the dynamic help
      return 'Cleans ' + this.config.dest;
    }
  }, {
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

var Default$12 = {
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
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function CleanImages(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, CleanImages);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(CleanImages).call(this, gulp, preset, extend(true, {}, Default$12, config)));
  }

  return CleanImages;
}(BaseClean);

var Default$14 = {
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
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function CleanStylesheets(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, CleanStylesheets);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(CleanStylesheets).call(this, gulp, preset, extend(true, {}, Default$14, config)));
  }

  return CleanStylesheets;
}(BaseClean);

var Default$15 = {
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
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function CleanJavascripts(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, CleanJavascripts);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(CleanJavascripts).call(this, gulp, preset, extend(true, {}, Default$15, config)));
  }

  return CleanJavascripts;
}(BaseClean);

var Default$16 = {
  presetType: 'digest',
  task: {
    name: 'clean:digest'
  }
};

var CleanDigest = function (_BaseClean) {
  babelHelpers.inherits(CleanDigest, _BaseClean);


  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function CleanDigest(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, CleanDigest);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(CleanDigest).call(this, gulp, preset, extend(true, {}, Default$16, config)));
  }

  return CleanDigest;
}(BaseClean);

var Default$17 = {
  debug: false,
  watch: false,
  presetType: 'macro',
  task: {
    name: 'clean',
    help: 'Cleans images, stylesheets, and javascripts.'
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

    var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Clean).call(this, gulp, preset, extend(true, {}, Default$17, config)));

    _this.cleanImages = new CleanImages(gulp, preset);
    _this.cleanStylesheets = new CleanStylesheets(gulp, preset);
    _this.cleanJavascripts = new CleanJavascripts(gulp, preset);
    _this.cleanDigest = new CleanDigest(gulp, preset);
    return _this;
  }

  babelHelpers.createClass(Clean, [{
    key: 'run',
    value: function run() {
      this.cleanImages.run();
      this.cleanStylesheets.run();
      this.cleanJavascripts.run();
      this.cleanDigest.run();
    }
  }]);
  return Clean;
}(BaseRecipe);

var Default$18 = {
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
};

var Rev = function (_BaseRecipe) {
  babelHelpers.inherits(Rev, _BaseRecipe);


  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function Rev(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, Rev);

    var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Rev).call(this, gulp, preset, extend(true, {}, Default$18, config)));

    _this.browserSync = BrowserSync.create();
    return _this;
  }

  babelHelpers.createClass(Rev, [{
    key: 'createHelpText',
    value: function createHelpText() {
      return 'Adds revision digest to assets from ' + this.config.source.options.cwd + '/' + this.config.source.glob;
    }
  }, {
    key: 'run',
    value: function run() {
      var _this2 = this;

      var watching = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];


      // FIXME merge in the clean as a task

      return this.gulp.src(this.config.source.glob, this.config.source.options)
      //.pipe(changed(this.config.dest)) // ignore unchanged files
      .pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(rev(this.config.options)).pipe(this.gulp.dest(this.config.dest)).pipe(rev.manifest()).pipe(this.gulp.dest(this.config.dest)).on('error', function (error) {
        _this2.notifyError(error, watching);
      }).pipe(this.browserSync.stream());
    }
  }]);
  return Rev;
}(BaseRecipe);

var Default$19 = {
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
};

/**
 * Recipe to be run after Rev or any other that places final assets in the digest destination directory
 */
var MinifyCss = function (_BaseRecipe) {
  babelHelpers.inherits(MinifyCss, _BaseRecipe);


  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function MinifyCss(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, MinifyCss);

    var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(MinifyCss).call(this, gulp, preset, extend(true, {}, Default$19, config)));

    _this.browserSync = BrowserSync.create();
    return _this;
  }

  babelHelpers.createClass(MinifyCss, [{
    key: 'createHelpText',
    value: function createHelpText() {
      return 'Minifies digest css from ' + this.config.source.options.cwd + '/' + this.config.source.glob;
    }
  }, {
    key: 'run',
    value: function run() {
      var _this2 = this;

      var watching = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];


      // FIXME merge in the clean as a task

      return this.gulp.src(this.config.source.glob, this.config.source.options).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(cssnano(this.config.options)).pipe(this.gulp.dest(this.config.dest)).on('error', function (error) {
        _this2.notifyError(error, watching);
      }).pipe(this.browserSync.stream());
    }
  }]);
  return MinifyCss;
}(BaseRecipe);

var Default$20 = {
  debug: false,
  presetType: 'javascripts',
  task: {
    name: 'mocha'
  },
  options: {}
};

var Mocha = function (_BaseRecipe) {
  babelHelpers.inherits(Mocha, _BaseRecipe);


  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */

  function Mocha(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, Mocha);

    // resolve watch cwd based on test cwd
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Mocha).call(this, gulp, preset, extend(true, {}, Default$20, { watch: { options: { cwd: Preset.resolveConfig(preset, Default$20, config).test.options.cwd } } }, config)));
  }

  babelHelpers.createClass(Mocha, [{
    key: 'createHelpText',
    value: function createHelpText() {
      return 'Tests ' + this.config.test.options.cwd + '/' + this.config.test.glob;
    }
  }, {
    key: 'run',
    value: function run() {
      var _this2 = this;

      var watching = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

      var bundle = this.gulp.src(this.config.test.glob, this.config.test.options).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(mocha({ reporter: 'nyan' })) // gulp-mocha needs filepaths so you can't have any plugins before it
      .on('error', function (error) {
        _this2.notifyError(error, watching);
      });

      return bundle;
    }
  }]);
  return Mocha;
}(BaseRecipe);

/**
 *  This is the base for publish recipes using BuildControl
 */
var Default$22 = {

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
};

var BasePublish = function (_BaseRecipe) {
  babelHelpers.inherits(BasePublish, _BaseRecipe);


  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */

  function BasePublish(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, BasePublish);


    // use the dir as the cwd to the BuildControl class

    var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(BasePublish).call(this, gulp, preset, extend(true, {}, Default$22, config)));

    _this.config.options = extend(true, { debug: _this.config.debug, cwd: _this.config.dir }, _this.config.options);
    return _this;
  }

  return BasePublish;
}(BaseRecipe);

var Default$21 = {
  task: {
    name: 'prepublish',
    help: 'Checks tag name and ensures directory has all files committed.'
  },
  options: {
    tag: {
      existsFailure: true
    }
  }
};

/**
 *  This recipe will run a preflight check on publishing to ensure tag name and commits are ready to go.
 *
 *  Run this before long running tests to error your build quickly.
 */
var Prepublish = function (_BasePublish) {
  babelHelpers.inherits(Prepublish, _BasePublish);


  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */

  function Prepublish(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, Prepublish);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Prepublish).call(this, gulp, preset, extend(true, {}, Default$21, config)));
  }

  babelHelpers.createClass(Prepublish, [{
    key: 'run',
    value: function run() {
      var buildControl = new BuildControl(this.config.options);
      buildControl.prepublishCheck();
    }
  }]);
  return Prepublish;
}(BasePublish);

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
var Default$23 = {
  //debug: true,
  readme: {
    enabled: true,
    name: 'README.md',
    template: '# %sourceName%\n\n%sourceTagLink% built from commit %sourceCommitLink% on branch `%sourceBranch%`. See the [README](../..) for more details\n\n---\n<sup>Built and published by [gulp-pipeline](https://github.com/alienfast/gulp-pipeline) using [build-control](https://github.com/alienfast/build-control)</sup>\n'
  },
  task: {
    name: 'publishBuild',
    help: 'Assembles and pushes the build to a branch'
  }
};

var PublishBuild = function (_BasePublish) {
  babelHelpers.inherits(PublishBuild, _BasePublish);


  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */

  function PublishBuild(gulp, preset) {
    var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    babelHelpers.classCallCheck(this, PublishBuild);
    return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(PublishBuild).call(this, gulp, preset, extend(true, {}, Default$23, config)));
  }

  /**
   * Copy all the configured sources to the config.dir directory
   */


  babelHelpers.createClass(PublishBuild, [{
    key: 'prepareBuildFiles',
    value: function prepareBuildFiles() {
      var buildDir = this.config.dir;
      this.debug('Using build directory: ' + buildDir);

      // copy preset type files
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.config.source.types[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var type = _step.value;

          var typePreset = this.preset[type];

          this.log('Copying ' + typePreset.source.options.cwd + '/' + typePreset.source.all + '...');
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = glob.sync(typePreset.source.all, typePreset.source.options)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var name = _step3.value;

              var from = path.join(typePreset.source.options.cwd, name);
              var to = path.join(buildDir, from);
              this.log('\t...to ' + to);
              fs$1.copySync(from, to);
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }
        }

        // copy any additional configured files
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

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.config.source.files[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var fileGlob = _step2.value;


          this.log('Copying ' + fileGlob + '...');
          var _iteratorNormalCompletion4 = true;
          var _didIteratorError4 = false;
          var _iteratorError4 = undefined;

          try {
            for (var _iterator4 = glob.sync(fileGlob, { realpath: true })[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
              var fromFullPath = _step4.value;

              var from = path.relative(process.cwd(), fromFullPath);
              var to = path.join(buildDir, from);
              this.log('\t...to ' + to);
              fs$1.copySync(from, to);
            }
          } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
              }
            } finally {
              if (_didIteratorError4) {
                throw _iteratorError4;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }, {
    key: 'run',
    value: function run() {
      var buildControl = new BuildControl(this.config.options);

      // bump the version and commit to git
      buildControl.npm.bump();

      this.prepareBuildFiles();

      // generate a readme on the branch if one is not copied in.
      if (this.config.readme.enabled) {
        var readme = path.join(this.config.dir, this.config.readme.name);
        if (fs$1.existsSync(readme)) {
          this.log('Found readme at ' + readme + '.  Will not generate a new one from the template.  Turn this message off with { readme: {enabled: false} }');
        } else {
          fs$1.writeFileSync(readme, buildControl.interpolate(this.config.readme.template));
        }
      }

      // run the commit/tagging/pushing
      buildControl.run();

      // publish to npm
      buildControl.npm.publish();
    }
  }, {
    key: 'resolvePath',
    value: function resolvePath(cwd) {
      var base = arguments.length <= 1 || arguments[1] === undefined ? process.cwd() : arguments[1];

      if (!pathIsAbsolute(cwd)) {
        return path.join(base, cwd);
      } else {
        return cwd;
      }
    }
  }]);
  return PublishBuild;
}(BasePublish);

exports.Preset = Preset;
exports.Rails = Rails;
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
exports.CleanDigest = CleanDigest;
exports.Clean = Clean;
exports.Rev = Rev;
exports.MinifyCss = MinifyCss;
exports.Mocha = Mocha;
exports.Prepublish = Prepublish;
exports.PublishBuild = PublishBuild;
//# sourceMappingURL=gulp-pipeline.cjs.js.map