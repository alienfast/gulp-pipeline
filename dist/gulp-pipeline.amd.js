define(['exports', 'extend', 'path', 'fs', 'glob', 'cross-spawn', 'jsonfile', 'gulp-util', 'stringify-object', 'gulp-notify', 'shelljs', 'gulp-eslint', 'gulp-debug', 'gulp-if', 'gulp-uglify', 'gulp-sourcemaps', 'gulp-concat', 'gulp-ext-replace', 'gulp-autoprefixer', 'browser-sync', 'gulp-changed', 'gulp-imagemin', 'merge-stream', 'gulp-sass', 'findup-sync', 'gulp-scss-lint', 'gulp-scss-lint-stylish', 'rollup', 'rollup-plugin-node-resolve', 'rollup-plugin-commonjs', 'process', 'rollup-plugin-babel', 'fs-extra', 'file-sync-cmp', 'iconv-lite', 'buffer', 'chalk', 'glob-all', 'del', 'gulp-rev', 'gulp-cssnano', 'gulp-mocha', 'build-control', 'path-is-absolute', 'tmp'], function (exports, extend, path, fs, glob, spawn, jsonfile, Util, stringify, notify, shelljs, eslint, debug, gulpif, uglify, sourcemaps, concat, extReplace, autoprefixer, BrowserSync, changed, imagemin, merge, sass, findup, scssLint, scssLintStylish, rollup, nodeResolve, commonjs, process, babel, fs$1, fileSyncCmp, iconv, buffer, chalk, globAll, del, rev, cssnano, mocha, buildControl, pathIsAbsolute, tmp) { 'use strict';

  extend = 'default' in extend ? extend['default'] : extend;
  path = 'default' in path ? path['default'] : path;
  fs = 'default' in fs ? fs['default'] : fs;
  glob = 'default' in glob ? glob['default'] : glob;
  spawn = 'default' in spawn ? spawn['default'] : spawn;
  jsonfile = 'default' in jsonfile ? jsonfile['default'] : jsonfile;
  Util = 'default' in Util ? Util['default'] : Util;
  stringify = 'default' in stringify ? stringify['default'] : stringify;
  notify = 'default' in notify ? notify['default'] : notify;
  shelljs = 'default' in shelljs ? shelljs['default'] : shelljs;
  eslint = 'default' in eslint ? eslint['default'] : eslint;
  debug = 'default' in debug ? debug['default'] : debug;
  gulpif = 'default' in gulpif ? gulpif['default'] : gulpif;
  uglify = 'default' in uglify ? uglify['default'] : uglify;
  sourcemaps = 'default' in sourcemaps ? sourcemaps['default'] : sourcemaps;
  concat = 'default' in concat ? concat['default'] : concat;
  extReplace = 'default' in extReplace ? extReplace['default'] : extReplace;
  autoprefixer = 'default' in autoprefixer ? autoprefixer['default'] : autoprefixer;
  BrowserSync = 'default' in BrowserSync ? BrowserSync['default'] : BrowserSync;
  changed = 'default' in changed ? changed['default'] : changed;
  imagemin = 'default' in imagemin ? imagemin['default'] : imagemin;
  merge = 'default' in merge ? merge['default'] : merge;
  sass = 'default' in sass ? sass['default'] : sass;
  findup = 'default' in findup ? findup['default'] : findup;
  scssLint = 'default' in scssLint ? scssLint['default'] : scssLint;
  scssLintStylish = 'default' in scssLintStylish ? scssLintStylish['default'] : scssLintStylish;
  nodeResolve = 'default' in nodeResolve ? nodeResolve['default'] : nodeResolve;
  commonjs = 'default' in commonjs ? commonjs['default'] : commonjs;
  process = 'default' in process ? process['default'] : process;
  babel = 'default' in babel ? babel['default'] : babel;
  fs$1 = 'default' in fs$1 ? fs$1['default'] : fs$1;
  fileSyncCmp = 'default' in fileSyncCmp ? fileSyncCmp['default'] : fileSyncCmp;
  iconv = 'default' in iconv ? iconv['default'] : iconv;
  chalk = 'default' in chalk ? chalk['default'] : chalk;
  globAll = 'default' in globAll ? globAll['default'] : globAll;
  del = 'default' in del ? del['default'] : del;
  rev = 'default' in rev ? rev['default'] : rev;
  cssnano = 'default' in cssnano ? cssnano['default'] : cssnano;
  mocha = 'default' in mocha ? mocha['default'] : mocha;
  pathIsAbsolute = 'default' in pathIsAbsolute ? pathIsAbsolute['default'] : pathIsAbsolute;
  tmp = 'default' in tmp ? tmp['default'] : tmp;

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

  var Ruby = function () {
    function Ruby() {
      babelHelpers.classCallCheck(this, Ruby);
    }

    babelHelpers.createClass(Ruby, null, [{
      key: 'localPath',
      value: function localPath(name) {
        var filename = '' + name;

        // if using source dir
        var filepath = path.join(__dirname, filename); // eslint-disable-line no-undef
        try {
          fs.statSync(filepath);
        } catch (error) {
          // if using dist dir, use the relative src/ruby path
          filepath = path.join(__dirname, '../src/ruby', filename); // eslint-disable-line no-undef
          fs.statSync(filepath);
        }

        return filepath;
      }
    }]);
    return Ruby;
  }();

  var BaseDirectoriesCache = '.gulp-pipeline-rails.json';
  var GemfileLock = 'Gemfile.lock';

  var Rails = function () {
    function Rails() {
      babelHelpers.classCallCheck(this, Rails);
    }

    babelHelpers.createClass(Rails, null, [{
      key: 'enumerateEngines',
      value: function enumerateEngines() {

        var results = spawn.sync(Ruby.localPath('railsRunner.sh'), [Ruby.localPath('enumerateEngines.rb')], {
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
    postProcessor: {
      source: { options: { cwd: 'dist' } },
      watch: { options: { cwd: 'dist' } },
      dest: 'dist/digest'
    }
  };

  var PresetNodeSrc = {};

  var PresetNodeLib = {
    javascripts: {
      source: { options: { cwd: 'lib' } },
      watch: { options: { cwd: 'lib' } }
      //test: {options: {cwd: 'test'}}
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
    postProcessor: {
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
      key: 'baseline',
      value: function baseline() {
        var overrides = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        return extend(true, {}, Baseline, overrides);
      }
    }, {
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

  var Default$3 = {
    watch: true,
    debug: false
  };

  var Base = function () {

    /**
     *
     * @param gulp - gulp instance
     * @param config - customized overrides
     */

    function Base() {
      babelHelpers.classCallCheck(this, Base);

      for (var _len = arguments.length, configs = Array(_len), _key = 0; _key < _len; _key++) {
        configs[_key] = arguments[_key];
      }

      this.config = extend.apply(undefined, [true, {}, Default$3].concat(configs));
      this.debug('[' + this.constructor.name + '] using resolved config: ' + stringify(this.config));
    }

    // ----------------------------------------------
    // protected


    babelHelpers.createClass(Base, [{
      key: 'requireValue',
      value: function requireValue(value, name) {
        if (value === undefined || value == null) {
          this.notifyError(name + ' must be defined, found: ' + value);
        }
      }
    }, {
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
        this.debug(msg + ':\n' + this.dump(obj));
      }
    }, {
      key: 'dump',
      value: function dump(obj) {
        return stringify(obj);
      }
    }, {
      key: 'notifyError',
      value: function notifyError(error, e) {
        this.log(error);
        throw e;
      }
    }, {
      key: 'debugOptions',
      value: function debugOptions() {
        return { title: '[' + Util.colors.cyan('debug') + '][' + Util.colors.cyan(this.taskName()) + ']' };
      }
    }]);
    return Base;
  }();

  var Default$2 = {
    debug: false,
    watch: true,
    task: {
      name: undefined,
      description: '',
      prefix: '', // task name prefix
      suffix: '' // task name suffix
    }
  };

  var BaseGulp = function (_Base) {
    babelHelpers.inherits(BaseGulp, _Base);


    /**
     *
     * @param gulp - gulp instance
     * @param config - customized overrides
     */

    function BaseGulp(gulp) {
      var _Object$getPrototypeO;

      babelHelpers.classCallCheck(this, BaseGulp);

      for (var _len = arguments.length, configs = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        configs[_key - 1] = arguments[_key];
      }

      var _this = babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(BaseGulp)).call.apply(_Object$getPrototypeO, [this, Default$2].concat(configs)));

      _this.gulp = gulp;
      return _this;
    }

    babelHelpers.createClass(BaseGulp, [{
      key: 'taskName',
      value: function taskName() {
        if (!this.config.task || !this.config.task.name) {
          return '';
        }

        //if (!this.config.task.name) {
        //  this.notifyError(`Expected ${this.constructor.name} to have a task name in the configuration.`)
        //}
        return '' + this.config.task.prefix + this.config.task.name + this.config.task.suffix;
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
      key: 'notifyError',
      value: function notifyError(error, done) {
        //, watching = false) {

        //this.debugDump('notifyError', error)

        var lineNumber = error.lineNumber ? 'Line ' + error.lineNumber + ' -- ' : '';
        var taskName = error.task || (this.config.task && this.config.task.name ? this.taskName() : this.constructor.name);

        var title = 'Task [' + taskName + '] failed';
        if (error.plugin) {
          title += ' in [' + error.plugin + ']';
        }

        notify({
          title: title,
          message: lineNumber + 'See console.',
          sound: 'Sosumi' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
        }).write(error);

        var tag = Util.colors.black.bgRed;
        var report = '\n' + tag('    Task:') + ' [' + Util.colors.cyan(taskName) + ']\n';

        if (error.plugin) {
          report += tag('  Plugin:') + ' [' + error.plugin + ']\n';
        }

        report += tag('   Error:') + ' ';

        if (error.message) {
          report += error.message + '\n';
        } else {
          report += error + '\n';
        }

        if (error.lineNumber) {
          report += tag('    Line:') + ' ' + error.lineNumber + '\n';
        }

        if (error.fileName) {
          report += tag('    File:') + ' ' + error.fileName + '\n';
        }
        this.log(report);

        // Prevent the 'watch' task from stopping
        //if (!watching && this.gulp) {
        if (this.gulp) {
          // if this is not used, we see "Did you forget to signal async completion?", it also unfortunately logs more distracting information below.  But we need to exec the callback with an error to halt execution.

          this.donezo(done, error);
        } else {
          throw error;
        }
      }

      /**
       * if done is provided, run it
       *
       * @param done
       */

    }, {
      key: 'donezo',
      value: function donezo(done) {
        var error = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        if (done) {
          if (error) {
            this.debug('executing callback with error');
            done(error);
          } else {
            this.debug('executing callback without error');
            done();
          }
        } else {
          this.debug('done callback was not provided');
        }
      }

      /**
       * Wraps shellJs calls that act on the file structure to give better output and error handling
       * @param command
       * @param logResult - return output from the execution, defaults to true. If false, will return code instead
       * @param returnCode - defaults to false which will throw Error on error, true will return result code
       */

    }, {
      key: 'exec',
      value: function exec(command) {
        var logResult = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
        var returnCode = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

        var options = { silent: true };
        if (this.config.cwd) {
          options['cwd'] = this.config.cwd;
        } else {
          this.notifyError('cwd is required');
        }

        if (command.includes('undefined')) {
          this.notifyError('Invalid command: ' + command);
        }

        this.debug('Executing `' + command + '` with cwd: ' + options['cwd']);
        var shellResult = shelljs.exec(command, options);
        var output = this.logShellOutput(shellResult, logResult);

        if (shellResult.code === 0 || shellResult.code === 1) {

          // ---
          // determine the return value
          if (returnCode) {
            return shellResult.code;
          } else {
            return output;
          }
        } else {
          if (returnCode) {
            return shellResult.code;
          } else {
            this.notifyError('Command failed `' + command + '`, cwd: ' + options.cwd + ': ' + shellResult.stderr + '.');
          }
        }
      }
    }, {
      key: 'logShellOutput',
      value: function logShellOutput(shellResult, logResult) {
        //this.debug(`[exit code] ${shellResult.code}`)

        // ---
        // Log the result
        // strangely enough, sometimes useful messages from git are an stderr even when it is a successful command with a 0 result code
        var output = shellResult.stdout;
        if (output == '') {
          output = shellResult.stderr;
        }

        //this.log(stringify(shellResult))
        if (output != '') {
          if (logResult) {
            this.log(output);
          } else {
            this.debug('[output] \n' + output);
          }
        }
        return output;
      }
    }]);
    return BaseGulp;
  }(Base);

  var Default$1 = {
    watch: true,
    debug: false
  };

  var BaseRecipe = function (_BaseGulp) {
    babelHelpers.inherits(BaseRecipe, _BaseGulp);


    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from preset.js or a custom hash
     * @param configs - customized overrides for this recipe
     */

    function BaseRecipe(gulp, preset) {
      babelHelpers.classCallCheck(this, BaseRecipe);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      // in case someone needs to inspect it later i.e. buildControl

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(BaseRecipe).call(this, gulp, extend(true, {}, Default$1, { baseDirectories: preset.baseDirectories }, Preset.resolveConfig.apply(Preset, [preset].concat(configs)))));

      _this.preset = preset;
      _this.registerTask();
      _this.registerWatchTask();
      return _this;
    }

    babelHelpers.createClass(BaseRecipe, [{
      key: 'registerWatchTask',
      value: function registerWatchTask() {
        var _this2 = this;

        if (this.config.watch) {
          (function () {
            // generate watch task e.g. sass:watch
            var name = _this2.watchTaskName();
            _this2.debug('Registering task: ' + Util.colors.green(name));
            _this2.watchFn = function () {
              _this2.log('[' + Util.colors.green(name) + '] watching ' + _this2.config.watch.glob + ' ' + stringify(_this2.config.watch.options) + '...');

              return _this2.gulp.watch(_this2.config.watch.glob, _this2.config.watch.options, function (event) {
                _this2.log('File ' + event.path + ' was ' + event.type + ', running ' + _this2.taskName() + '...');
                return Promise.resolve(_this2.run(null, true)).then(function () {
                  return _this2.logFinish();
                });
              });
            };
            _this2.watchFn.description = _this2.createWatchDescription();
            _this2.gulp.task(name, _this2.watchFn);
          })();
        }
      }
    }, {
      key: 'createWatchDescription',
      value: function createWatchDescription() {
        return Util.colors.grey('|___ watches ' + this.config.watch.options.cwd + '/' + this.config.watch.glob);
      }
    }, {
      key: 'registerTask',
      value: function registerTask() {
        var _this3 = this;

        // generate primary task e.g. sass

        // set a fn for use by the task, also used by aggregate/series/parallel
        this.taskFn = function (done) {
          //this.log(`Running task: ${Util.colors.green(name)}`)

          if (_this3.config.debug) {
            _this3.debugDump('Executing ' + Util.colors.green(_this3.taskName()) + ' with options:', _this3.config.options);
          }
          return _this3.run(done);
        };

        if (this.config.task && this.config.task.name) {
          var name = this.taskName();
          if (this.createDescription !== undefined) {
            this.config.task.description = this.createDescription();
          }

          this.debug('Registering task: ' + Util.colors.green(name));

          // set metadata on fn for discovery by gulp
          this.taskFn.displayName = name;
          this.taskFn.description = this.config.task.description;

          // register the task
          this.gulp.task(name, this.taskFn);
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
  }(BaseGulp);

  var Default = {
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
     * @param configs - customized overrides for this recipe
     */

    function EsLint(gulp, preset) {
      babelHelpers.classCallCheck(this, EsLint);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(EsLint).call(this, gulp, preset, extend.apply(undefined, [true, {}, Default].concat(configs))));
    }

    babelHelpers.createClass(EsLint, [{
      key: 'createDescription',
      value: function createDescription() {
        return 'Lints ' + this.config.source.options.cwd + '/' + this.config.source.glob;
      }
    }, {
      key: 'run',
      value: function run(done) {
        var _this2 = this;

        var watching = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

        // eslint() attaches the lint output to the "eslint" property of the file object so it can be used by other modules.
        return this.gulp.src(this.config.source.glob, this.config.source.options).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(eslint(this.config.options)).pipe(eslint.format()) // outputs the lint results to the console. Alternatively use eslint.formatEach() (see Docs).
        .pipe(gulpif(!watching, eslint.failAfterError())) // To have the process exit with an error code (1) on lint error, return the stream and pipe to failAfterError last.
        .on('error', function (error) {
          _this2.notifyError(error, done, watching);
        });

        // FIXME: even including any remnant of JSCS at this point broke everything through the unfound requirement of babel 5.x through babel-jscs.  I can't tell where this occurred, but omitting gulp-jscs for now gets me past this issue.  Revisit this when there are clear updates to use babel 6
        //.pipe(jscs())      // enforce style guide
        //.pipe(stylish())  // log style errors
        //.pipe(jscs.reporter('fail')) // fail on error
      }
    }]);
    return EsLint;
  }(BaseRecipe);

  var Default$4 = {
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
  };

  /**
   * By default, assumes ONE source glob file match, OTHERWISE specify {concat: { dest: 'out.min.js' } }
   *
   */
  var Uglify = function (_BaseRecipe) {
    babelHelpers.inherits(Uglify, _BaseRecipe);


    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from preset.js or a custom hash
     * @param configs - customized overrides for this recipe
     */

    function Uglify(gulp, preset) {
      var _Object$getPrototypeO;

      babelHelpers.classCallCheck(this, Uglify);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(Uglify)).call.apply(_Object$getPrototypeO, [this, gulp, preset, Default$4].concat(configs)));
    }

    babelHelpers.createClass(Uglify, [{
      key: 'createDescription',
      value: function createDescription() {
        var msg = 'Uglifies ' + this.config.source.options.cwd + '/' + this.config.source.glob + ' to ' + this.config.dest;
        if (this.config.concat.dest) {
          msg += '/' + this.config.concat.dest;
        }
        return msg;
      }
    }, {
      key: 'run',
      value: function run(done) {
        var _this2 = this;

        var watching = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];


        // helpful log message if files not found
        var files = glob.sync(this.config.source.glob, this.config.source.options);
        if (!files || files.length <= 0) {
          this.log('No sources found to uglify in: ' + this.dump(this.config.source));
        }

        if (this.config.concat.dest) {

          // run the concat scenario
          this.debug('concat dest: ' + this.config.concat.dest);
          return this.gulp.src(this.config.source.glob, this.config.source.options).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(concat(this.config.concat.dest))

          // identical to below
          .pipe(sourcemaps.init()).pipe(uglify(this.config.options)).on('error', function (error) {
            _this2.notifyError(error, done, watching);
          }).pipe(this.gulp.dest(this.config.dest));
        } else {

          // run the single file scenario
          this.debug('single file with no dest');

          if (files.length > 1) {
            throw new Error('Should only find one file but found ' + files.length + ' for source: ' + this.dump(this.config.source) + '.  Use the concat: {dest: \'output.min.js\' } configuration for multiple files concatenated with uglify.');
          }

          return this.gulp.src(this.config.source.glob, this.config.source.options).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(extReplace('.min.js'))

          // identical to above
          .pipe(sourcemaps.init()).pipe(uglify(this.config.options)).on('error', function (error) {
            _this2.notifyError(error, done, watching);
          }).pipe(this.gulp.dest(this.config.dest));
        }
      }
    }]);
    return Uglify;
  }(BaseRecipe);

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
     * @param configs - customized overrides for this recipe
     */

    function Autoprefixer(gulp, preset) {
      var _Object$getPrototypeO;

      babelHelpers.classCallCheck(this, Autoprefixer);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(Autoprefixer)).call.apply(_Object$getPrototypeO, [this, gulp, preset, AutoprefixerDefault].concat(configs)));
    }

    babelHelpers.createClass(Autoprefixer, [{
      key: 'run',
      value: function run(done) {
        var _this2 = this;

        var watching = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

        // FIXME: is this right or wrong?  this class initially was extracted for reuse of Default options
        return this.gulp.src(this.config.source).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(autoprefixer(this.config.options)).on('error', function (error) {
          _this2.notifyError(error, done, watching);
        }).pipe(this.gulp.dest(this.config.dest));
      }
    }]);
    return Autoprefixer;
  }(BaseRecipe);

  var Default$5 = {
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
     * @param configs - customized overrides for this recipe
     */

    function Images(gulp, preset) {
      babelHelpers.classCallCheck(this, Images);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Images).call(this, gulp, preset, extend.apply(undefined, [true, {}, Default$5].concat(configs))));

      _this.browserSync = BrowserSync.create();
      return _this;
    }

    babelHelpers.createClass(Images, [{
      key: 'createDescription',
      value: function createDescription() {
        return 'Minifies change images from ' + this.config.source.options.cwd + '/' + this.config.source.glob;
      }
    }, {
      key: 'run',
      value: function run(done) {
        var _this2 = this;

        var watching = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];


        var tasks = this.config.baseDirectories.map(function (baseDirectory) {
          // join the base dir with the relative cwd
          return _this2.runOne(done, path.join(baseDirectory, _this2.config.source.options.cwd), watching);
        });
        return merge(tasks);
      }
    }, {
      key: 'runOne',
      value: function runOne(done, cwd, watching) {
        var _this3 = this;

        // setup a run with a single cwd a.k.a base directory FIXME: perhaps this could be in the base recipe? or not?
        var options = extend({}, this.config.source.options);
        options.cwd = cwd;
        this.debug('src: ' + cwd + '/' + this.config.source.glob);

        return this.gulp.src(this.config.source.glob, options).pipe(changed(this.config.dest)) // ignore unchanged files
        .pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(imagemin(this.config.options)).on('error', function (error) {
          _this3.notifyError(error, done, watching);
        }).pipe(this.gulp.dest(this.config.dest)).pipe(this.browserSync.stream());
      }
    }]);
    return Images;
  }(BaseRecipe);

  var node_modules = findup('node_modules');

  var Default$6 = {
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
     * @param configs - customized overrides for this recipe
     */

    function Sass(gulp, preset) {
      babelHelpers.classCallCheck(this, Sass);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Sass).call(this, gulp, preset, extend.apply(undefined, [true, {}, Default$6].concat(configs))));

      _this.browserSync = BrowserSync.create();
      return _this;
    }

    babelHelpers.createClass(Sass, [{
      key: 'createDescription',
      value: function createDescription() {
        return 'Compiles ' + this.config.source.options.cwd + '/' + this.config.source.glob;
      }
    }, {
      key: 'run',
      value: function run(done) {
        var _this2 = this;

        var watching = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

        // add debug for importing problems (can be very helpful)
        if (this.config.debug && this.config.options.importer === undefined) {
          this.config.options.importer = function (url, prev, done) {
            _this2.debug('importing ' + url + ' from ' + prev);
            done({ file: url });
          };
        }

        return this.gulp.src(this.config.source.glob, this.config.source.options).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(sourcemaps.init()).pipe(sass(this.config.options)).on('error', function (error) {
          _this2.notifyError(error, done, watching);
        }).pipe(autoprefixer(this.config.autoprefixer.options)).pipe(sourcemaps.write()).pipe(this.gulp.dest(this.config.dest)).pipe(this.browserSync.stream());
      }
    }]);
    return Sass;
  }(BaseRecipe);

  var Default$7 = {
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
     * @param configs - customized overrides for this recipe
     */

    function ScssLint(gulp, preset) {
      babelHelpers.classCallCheck(this, ScssLint);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(ScssLint).call(this, gulp, preset, extend.apply(undefined, [true, {}, Default$7].concat(configs))));
    }

    babelHelpers.createClass(ScssLint, [{
      key: 'createDescription',
      value: function createDescription() {
        return 'Lints ' + this.config.source.options.cwd + '/' + this.config.source.glob;
      }
    }, {
      key: 'run',
      value: function run(done) {
        var _this2 = this;

        var watching = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

        return this.gulp.src(this.config.source.glob, this.config.source.options).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(scssLint(this.config.options)).on('error', function (error) {
          _this2.notifyError(error, done, watching);
        });
      }
    }]);
    return ScssLint;
  }(BaseRecipe);

  var Default$8 = {
    debug: false,
    watch: true // register a watch task that aggregates all watches and runs the full sequence
  };

  var Aggregate = function (_BaseGulp) {
    babelHelpers.inherits(Aggregate, _BaseGulp);


    /**
     *
     * @param gulp - gulp instance
     * @param configs - customized overrides
     */

    function Aggregate(gulp, taskName, recipes) {
      var _Object$getPrototypeO;

      babelHelpers.classCallCheck(this, Aggregate);

      for (var _len = arguments.length, configs = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        configs[_key - 3] = arguments[_key];
      }

      var _this = babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(Aggregate)).call.apply(_Object$getPrototypeO, [this, gulp, Default$8, { task: { name: taskName } }].concat(configs)));

      if (Array.isArray(recipes)) {
        _this.notifyError('recipes must not be an array, but a function, series, or parallel, found: ' + recipes);
      }

      // track recipes as taskFn so that aggregates can be included and resolved as part of other aggregates just like recipes
      _this.taskFn = recipes;
      _this.registerTask(_this.taskName());

      if (_this.config.watch) {
        _this.registerWatchTask(_this.watchTaskName());
      }
      return _this;
    }

    babelHelpers.createClass(Aggregate, [{
      key: 'createHelpText',
      value: function createHelpText() {
        //let taskNames = new Recipes().toTasks(this.taskFn)
        //
        //// use the config to generate the dynamic help
        //return `Runs [${taskNames.join(', ')}]`
        return '';
      }
    }, {
      key: 'createWatchHelpText',
      value: function createWatchHelpText() {
        var taskNames = this.watchableRecipes().reduce(function (a, b) {
          return a.concat(b.taskName());
        }, []);

        return Util.colors.grey('|___ aggregates watches from [' + taskNames.join(', ') + '] and runs all tasks on any change');
      }
    }, {
      key: 'registerTask',
      value: function registerTask(taskName) {
        //let tasks = this.toTasks(this.taskFn)
        //this.debug(`Registering task: ${Util.colors.green(taskName)} for ${stringify(tasks)}`)
        this.gulp.task(taskName, this.taskFn);
        this.taskFn.description = this.createHelpText();
      }
    }, {
      key: 'registerWatchTask',
      value: function registerWatchTask(taskName) {
        var _this2 = this;

        // generate watch task
        var watchableRecipes = this.watchableRecipes();
        if (watchableRecipes.length < 1) {
          this.debug('No watchable recipes for task: ' + Util.colors.green(taskName));
          return;
        }

        this.debug('Registering task: ' + Util.colors.green(taskName));

        // on error ensure that we reset the flag so that it runs again
        this.gulp.on('error', function () {
          _this2.debug('Yay! listened for the error and am able to reset the running flag!');
          _this2.taskFn.running = false;
        });

        var watchFn = function watchFn() {
          // watch the watchable recipes and make them #run the series
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            var _loop = function _loop() {
              var recipe = _step.value;

              _this2.log('[' + Util.colors.green(taskName) + '] watching for ' + recipe.taskName() + ' ' + recipe.config.watch.glob + '...');

              // declare this in here so we can use different display names in the log
              var runFn = function runFn(done) {
                // ensure that multiple watches do not run the entire set of recipes multiple times on a single change
                if (_this2.taskFn.running) {
                  _this2.debug('Multiple matching watchers, skipping this one...');
                  done();
                  return;
                } else {
                  _this2.debug('Allowing it to run....');
                  _this2.taskFn.running = true;
                }

                var finishFn = function finishFn() {
                  _this2.log('[' + Util.colors.green(taskName) + '] finished');
                  _this2.taskFn.running = false;
                };

                _this2.gulp.series(_this2.taskFn, finishFn, done)();
              };
              runFn.displayName = recipe.taskName() + ' watcher';

              var watcher = _this2.gulp.watch(recipe.config.watch.glob, recipe.config.watch.options, runFn);
              var recipeName = Util.colors.grey('(' + recipe.taskName() + ')');
              // add watchers for logging/information
              watcher.on('add', function (path) {
                if (!_this2.taskFn.running) {
                  _this2.log('[' + Util.colors.green(taskName) + ' ' + recipeName + '] ' + path + ' was added, running...');
                }
              });
              watcher.on('change', function (path) {
                if (!_this2.taskFn.running) {
                  _this2.log('[' + Util.colors.green(taskName) + ' ' + recipeName + '] ' + path + ' was changed, running...');
                }
              });
              watcher.on('unlink', function (path) {
                if (!_this2.taskFn.running) {
                  _this2.log('[' + Util.colors.green(taskName) + ' ' + recipeName + '] ' + path + ' was deleted, running...');
                }
              });
            };

            for (var _iterator = watchableRecipes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              _loop();
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
        };

        watchFn.description = this.createWatchHelpText();
        this.gulp.task(taskName, watchFn);
      }
    }, {
      key: 'flatten',
      value: function flatten(list) {
        var _this3 = this;

        return list.reduce(function (a, b) {
          return(
            // parallel and series set `.recipes` on the function as metadata
            a.concat(typeof b === "function" && b.recipes ? _this3.flatten(b.recipes) : b)
          );
        }, []);
      }
    }, {
      key: 'flattenedRecipes',
      value: function flattenedRecipes() {
        var recipes = this.flatten([this.taskFn]);
        this.debugDump('flattenedRecipes', recipes);
        return recipes;
      }
    }, {
      key: 'watchableRecipes',
      value: function watchableRecipes() {
        // create an array of watchable recipes
        var watchableRecipes = [];
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = this.flattenedRecipes()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var recipe = _step2.value;

            if (typeof recipe !== "string" && recipe.config.watch) {
              watchableRecipes.push(recipe);
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

        return watchableRecipes;
      }
    }]);
    return Aggregate;
  }(BaseGulp);

  var node_modules$1 = findup('node_modules');

  var Default$9 = {
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
     * @param configs - customized overrides for this recipe
     */

    function RollupEs(gulp, preset) {
      babelHelpers.classCallCheck(this, RollupEs);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      var config = extend.apply(undefined, [true, {}].concat(configs));

      if (!config.options.dest) {
        throw new Error('options.dest filename must be specified.');
      }

      // Utilize the presets to get the dest cwd/base directory, then add the remaining passed-in file path/name

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(RollupEs).call(this, gulp, preset, Default$9, NodeResolve, CommonJs, config));

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
      key: 'createDescription',
      value: function createDescription() {
        return 'Rollup ' + this.config.source.options.cwd + '/' + this.config.source.glob + ' in the ' + this.config.options.format + ' format to ' + this.config.options.dest;
      }
    }, {
      key: 'run',
      value: function run(done) {
        var _this2 = this;

        var watching = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

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
          _this2.notifyError(error, done, watching);
        });
      }
    }]);
    return RollupEs;
  }(BaseRecipe);

  var Default$10 = {
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
      enabled: false // bundle a full package with dependencies?
    },
    commonjs: {
      enabled: false // convert dependencies to commonjs modules for rollup
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
     * @param configs - customized overrides for this recipe
     */

    function RollupCjs(gulp, preset) {
      var _Object$getPrototypeO;

      babelHelpers.classCallCheck(this, RollupCjs);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(RollupCjs)).call.apply(_Object$getPrototypeO, [this, gulp, preset, Default$10].concat(configs)));
    }

    return RollupCjs;
  }(RollupEs);

  var Default$11 = {
    task: {
      name: 'rollup:cjs-bundled'
    },
    nodeResolve: {
      enabled: true // bundle a full package with dependencies? (if not use RollupCjs itself)
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
  var RollupCjsBundled = function (_RollupCjs) {
    babelHelpers.inherits(RollupCjsBundled, _RollupCjs);


    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from preset.js or a custom hash
     * @param configs - customized overrides for this recipe
     */

    function RollupCjsBundled(gulp, preset) {
      var _Object$getPrototypeO;

      babelHelpers.classCallCheck(this, RollupCjsBundled);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(RollupCjsBundled)).call.apply(_Object$getPrototypeO, [this, gulp, preset, Default$11].concat(configs)));
    }

    return RollupCjsBundled;
  }(RollupCjs);

  var Default$12 = {
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
  var RollupIife = function (_RollupCjsBundled) {
    babelHelpers.inherits(RollupIife, _RollupCjsBundled);


    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from preset.js or a custom hash
     * @param configs - customized overrides for this recipe
     */

    function RollupIife(gulp, preset) {
      var _Object$getPrototypeO;

      babelHelpers.classCallCheck(this, RollupIife);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(RollupIife)).call.apply(_Object$getPrototypeO, [this, gulp, preset, Default$12].concat(configs)));
    }

    return RollupIife;
  }(RollupCjsBundled);

  var Default$13 = {
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
     * @param configs - customized overrides for this recipe
     */

    function RollupAmd(gulp, preset) {
      var _Object$getPrototypeO;

      babelHelpers.classCallCheck(this, RollupAmd);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(RollupAmd)).call.apply(_Object$getPrototypeO, [this, gulp, preset, Default$13].concat(configs)));
    }

    return RollupAmd;
  }(RollupCjs);

  var Default$14 = {
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
     * @param configs - customized overrides for this recipe
     */

    function RollupUmd(gulp, preset) {
      var _Object$getPrototypeO;

      babelHelpers.classCallCheck(this, RollupUmd);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(RollupUmd)).call.apply(_Object$getPrototypeO, [this, gulp, preset, Default$14].concat(configs)));
    }

    return RollupUmd;
  }(RollupCjs);

  var isWindows = process.platform === 'win32';
  var pathSeparatorRe = /[\/\\]/g;

  /**
   * Implementation can use our base class, but is exposed as static methods in the exported File class
   *
   * TODO: reducing the amount of code by using other maintained libraries would be fantastic.  Worst case, break most of this into it's own library?
   *
   *  @credit to grunt for the grunt.file implementation. See license for attribution.
   */
  var FileImplementation = function (_Base) {
    babelHelpers.inherits(FileImplementation, _Base);

    function FileImplementation() {
      var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
      babelHelpers.classCallCheck(this, FileImplementation);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(FileImplementation).call(this, { encoding: "utf8" }, config));
    }

    // Read a file, optionally processing its content, then write the output.


    babelHelpers.createClass(FileImplementation, [{
      key: 'copy',
      value: function copy(srcpath, destpath, options) {
        if (!options) {
          options = {};
        }
        // If a process function was specified, process the file's source.

        // If the file will be processed, use the encoding as-specified. Otherwise, use an encoding of null to force the file to be read/written as a Buffer.
        var readWriteOptions = options.process ? options : { encoding: null };

        var contents = this.read(srcpath, readWriteOptions);
        if (options.process) {
          this.debug('Processing source...');
          try {
            contents = options.process(contents, srcpath);
          } catch (e) {
            this.notifyError('Error while executing process function on ' + srcpath + '.', e);
          }
        }
        // Abort copy if the process function returns false.
        if (contents === false) {
          this.debug('Write aborted, no contents.');
        } else {
          this.write(destpath, contents, readWriteOptions);
        }
      }
    }, {
      key: 'syncTimestamp',
      value: function syncTimestamp(src, dest) {
        var stat = fs$1.lstatSync(src);
        if (path.basename(src) !== path.basename(dest)) {
          return;
        }

        if (stat.isFile() && !fileSyncCmp.equalFiles(src, dest)) {
          return;
        }

        var fd = fs$1.openSync(dest, isWindows ? 'r+' : 'r');
        fs$1.futimesSync(fd, stat.atime, stat.mtime);
        fs$1.closeSync(fd);
      }
    }, {
      key: 'write',
      value: function write(filepath, contents, options) {
        if (!options) {
          options = {};
        }
        // Create path, if necessary.
        this.mkdir(path.dirname(filepath));
        try {
          // If contents is already a Buffer, don't try to encode it. If no encoding was specified, use the default.
          if (!buffer.Buffer.isBuffer(contents)) {
            contents = iconv.encode(contents, options.encoding || this.config.encoding);
          }
          // Actually write this.
          fs$1.writeFileSync(filepath, contents);

          return true;
        } catch (e) {
          this.notifyError('Unable to write ' + filepath + ' file (Error code: ' + e.code + ').', e);
        }
      }

      // Read a file, return its contents.

    }, {
      key: 'read',
      value: function read(filepath, options) {
        if (!options) {
          options = {};
        }
        var contents = void 0;
        this.debug('Reading ' + filepath + '...');
        try {
          contents = fs$1.readFileSync(String(filepath));
          // If encoding is not explicitly null, convert from encoded buffer to a
          // string. If no encoding was specified, use the default.
          if (options.encoding !== null) {
            contents = iconv.decode(contents, options.encoding || this.config.encoding);
            // Strip any BOM that might exist.
            if (!this.config.preserveBOM && contents.charCodeAt(0) === 0xFEFF) {
              contents = contents.substring(1);
            }
          }

          return contents;
        } catch (e) {
          this.notifyError('Unable to read "' + filepath + '" file (Error code: ' + e.code + ').', e);
        }
      }

      /**
       * Like mkdir -p. Create a directory and any intermediary directories.
       * @param dirpath
       * @param mode
       */

    }, {
      key: 'mkdir',
      value: function mkdir(dirpath, mode) {
        var _this2 = this;

        // Set directory mode in a strict-mode-friendly way.
        if (mode == null) {
          mode = parseInt('0777', 8) & ~process.umask();
        }
        dirpath.split(pathSeparatorRe).reduce(function (parts, part) {
          parts += part + '/';
          var subpath = path.resolve(parts);
          if (!_this2.exists(subpath)) {
            try {
              fs$1.mkdirSync(subpath, mode);
            } catch (e) {
              _this2.notifyError('Unable to create directory ' + subpath + ' (Error code: ' + e.code + ').', e);
            }
          }
          return parts;
        }, '');
      }

      /**
       * Match a filepath or filepaths against one or more wildcard patterns.
       * @returns true if any of the patterns match.
       */

    }, {
      key: 'isMatch',
      value: function isMatch() {
        return this.match.apply(this, arguments).length > 0;
      }
    }, {
      key: 'exists',
      value: function exists() {
        var filepath = path.join.apply(path, arguments);
        return fs$1.existsSync(filepath);
      }
    }, {
      key: 'isDir',
      value: function isDir() {
        var filepath = path.join.apply(path, arguments);
        return this.exists(filepath) && fs$1.statSync(filepath).isDirectory();
      }
    }, {
      key: 'detectDestType',
      value: function detectDestType(dest) {
        if (dest.endsWith('/')) {
          return 'directory';
        } else {
          return 'file';
        }
      }
    }]);
    return FileImplementation;
  }(Base);

  var File = function () {
    function File() {
      babelHelpers.classCallCheck(this, File);
    }

    babelHelpers.createClass(File, null, [{
      key: 'copy',
      value: function copy(srcpath, destpath, options) {
        return instance.copy(srcpath, destpath, options);
      }
    }, {
      key: 'syncTimestamp',
      value: function syncTimestamp(src, dest) {
        return instance.syncTimestamp(src, dest);
      }
    }, {
      key: 'write',
      value: function write(filepath, contents, options) {
        return instance.write(filepath, contents, options);
      }
    }, {
      key: 'read',
      value: function read(filepath, options) {
        return instance.read(filepath, options);
      }
    }, {
      key: 'isDir',
      value: function isDir() {
        return instance.isDir.apply(instance, arguments);
      }
    }, {
      key: 'mkdir',
      value: function mkdir(dirpath, mode) {
        return instance.mkdir(dirpath, mode);
      }
    }, {
      key: 'isMatch',
      value: function isMatch() {
        return instance.isMatch.apply(instance, arguments);
      }
    }, {
      key: 'exists',
      value: function exists() {
        return instance.exists.apply(instance, arguments);
      }
    }, {
      key: 'detectDestType',
      value: function detectDestType(dest) {
        return instance.detectDestType(dest);
      }
    }]);
    return File;
  }();

  //  singleton
  var instance = new FileImplementation();

  var Default$15 = {
    debug: false,
    watch: false,
    presetType: 'macro',
    task: {
      name: 'copy'
    },
    process: function process(content, srcpath) {
      // eslint-disable-line no-unused-vars
      return content;
    }, // allows modification of the file content before writing to destination
    encoding: 'utf8',
    mode: false, // True will copy the existing file/directory permissions, otherwise set the mode e.g. 0644
    timestamp: false, // Preserve the timestamp attributes(atime and mtime) when copying files. Timestamp will not be preserved
    //                        //    when the file contents or name are changed during copying.
    //preserveBOM: false,     // Whether to preserve the BOM on this.read rather than strip it.

    source: {
      glob: undefined, // [] or string glob pattern, uses node-glob-all https://github.com/jpillora/node-glob-all#usage
      options: { // https://github.com/isaacs/node-glob#options
        cwd: process.cwd() // base path
      }
    },
    dest: undefined, // base path
    options: {}
  };

  /**
   *  Copy files to a destination with permissions and processing options.
   *
   *  TODO: reducing the amount of code by using other maintained libraries would be fantastic.  Worst case, break most of this into it's own library?
   *
   *  @credit to grunt and grunt-contrib-copy for the implementation. See license for attribution.
   */
  var Copy = function (_BaseRecipe) {
    babelHelpers.inherits(Copy, _BaseRecipe);


    /**
     *
     * @param gulp - gulp instance
     * @param config - customized overrides
     */

    function Copy(gulp, preset) {
      babelHelpers.classCallCheck(this, Copy);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Copy).call(this, gulp, preset, extend.apply(undefined, [true, {}, Default$15].concat(configs))));

      _this.requireValue(_this.config.source.glob, 'source.glob');
      _this.requireValue(_this.config.source.options.cwd, 'source.options.cwd');
      _this.requireValue(_this.config.dest, 'dest');

      // ensure array
      if (!Array.isArray(_this.config.source.glob)) {
        _this.config.source.glob = [_this.config.source.glob];
      }
      return _this;
    }

    babelHelpers.createClass(Copy, [{
      key: 'createDescription',
      value: function createDescription() {
        return 'Copies ' + this.config.source.options.cwd + '/' + this.config.source.glob + ' to ' + this.config.dest;
      }
    }, {
      key: 'chmod',
      value: function chmod(from, to) {
        if (this.config.mode !== false) {
          fs$1.chmodSync(to, this.config.mode === true ? fs$1.lstatSync(from).mode : this.config.mode);
        }
      }
    }, {
      key: 'run',
      value: function run(done) {
        try {
          var dirs = {};
          var tally = {
            dirs: 0,
            files: 0
          };
          var copyOptions = {
            encoding: this.config.encoding,
            process: this.config.process
          };

          var options = extend(true, {}, this.config.source.options, { realpath: true });
          var pattern = this.config.source.glob;

          // ensure pattern is an array
          if (!Array.isArray(pattern)) {
            pattern = [pattern];
          }

          // make a copy so that nothing processing will alter the config values
          pattern = pattern.slice();

          this.log('Copying ' + options.cwd + '/' + pattern + '...');
          //this.debugDump(`this config: `, this.config)

          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = globAll.sync(pattern, options)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var fromFullPath = _step.value;

              var _from = path.relative(process.cwd(), fromFullPath);
              var toRelative = path.relative(options.cwd, _from); // grab the path of the file relative to the cwd of the source cwd - allows nesting
              var to = path.join(this.config.dest, toRelative);

              if (File.isDir(_from)) {
                this.log('\t' + chalk.cyan(to));
                File.mkdir(to);
                this.chmod(_from, to);
                dirs[_from] = to;
                tally.dirs++;
              } else {
                this.log('\t-> ' + chalk.cyan(to));
                File.copy(_from, to, copyOptions);
                if (this.config.timestamp) {
                  File.syncTimestamp(_from, to);
                }
                this.chmod(_from, to);
                tally.files++;
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

          if (this.config.timestamp) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = Object.keys(dirs)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var from = _step2.value;

                File.syncTimestamp(from, dirs[from]);
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

          var msg = '';
          if (tally.dirs) {
            msg += 'Created ' + (chalk.cyan(tally.dirs.toString()) + (tally.dirs === 1 ? ' directory' : ' directories'));
          }

          if (tally.files) {
            msg += (tally.dirs ? ', copied ' : 'Copied ') + chalk.cyan(tally.files.toString()) + (tally.files === 1 ? ' file' : ' files');
          }

          this.log(msg);
          this.donezo(done);
        } catch (error) {
          this.notifyError(error, done);
        }
      }
    }]);
    return Copy;
  }(BaseRecipe);

  var Default$17 = {
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
     * @param configs - customized overrides for this recipe
     */

    function BaseClean(gulp, preset) {
      var config = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      babelHelpers.classCallCheck(this, BaseClean);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(BaseClean).call(this, gulp, preset, extend(true, {}, Default$17, config)));
    }

    babelHelpers.createClass(BaseClean, [{
      key: 'createDescription',
      value: function createDescription() {
        // use the config to generate the dynamic help
        return 'Cleans ' + this.config.dest;
      }
    }, {
      key: 'run',
      value: function run(done) {
        var _this2 = this;

        var watching = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

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

        this.donezo(done);
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

  var Default$16 = {
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
     * @param configs - customized overrides for this recipe
     */

    function CleanImages(gulp, preset) {
      babelHelpers.classCallCheck(this, CleanImages);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(CleanImages).call(this, gulp, preset, extend.apply(undefined, [true, {}, Default$16].concat(configs))));
    }

    return CleanImages;
  }(BaseClean);

  var Default$18 = {
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
     * @param configs - customized overrides for this recipe
     */

    function CleanStylesheets(gulp, preset) {
      babelHelpers.classCallCheck(this, CleanStylesheets);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(CleanStylesheets).call(this, gulp, preset, extend.apply(undefined, [true, {}, Default$18].concat(configs))));
    }

    return CleanStylesheets;
  }(BaseClean);

  var Default$19 = {
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
     * @param configs - customized overrides for this recipe
     */

    function CleanJavascripts(gulp, preset) {
      babelHelpers.classCallCheck(this, CleanJavascripts);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(CleanJavascripts).call(this, gulp, preset, extend.apply(undefined, [true, {}, Default$19].concat(configs))));
    }

    return CleanJavascripts;
  }(BaseClean);

  var Default$20 = {
    presetType: 'postProcessor',
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
     * @param configs - customized overrides for this recipe
     */

    function CleanDigest(gulp, preset) {
      babelHelpers.classCallCheck(this, CleanDigest);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(CleanDigest).call(this, gulp, preset, extend.apply(undefined, [true, {}, Default$20].concat(configs))));
    }

    return CleanDigest;
  }(BaseClean);

  var Recipes = function (_Base) {
    babelHelpers.inherits(Recipes, _Base);

    function Recipes() {
      var config = arguments.length <= 0 || arguments[0] === undefined ? { debug: false } : arguments[0];
      babelHelpers.classCallCheck(this, Recipes);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Recipes).call(this, config));
    }

    /**
     * Prefer to return the taskFn instead of a string, but return the string if that's all that is given to us.
     *
     * @param recipe
     * @returns {*}
     */


    babelHelpers.createClass(Recipes, [{
      key: "toTask",
      value: function toTask(recipe) {
        var taskName = null;
        if (typeof recipe === "string") {
          // any given task name should be returned as-is
          taskName = recipe;
          this.debug("toTask(): " + taskName);
        } else {
          if (typeof recipe === "function") {
            // any given fn should be return as-is i.e. series/parallel
            taskName = recipe;
          } else {
            // any recipe should be converted to string task name
            taskName = recipe.taskFn;
          }
          this.debug("toTask(): " + (taskName.name || taskName.displayName));
        }
        return taskName;
      }

      /**
       * Yield the nearest set of task names - return nested series/parallel fn - do not follow them and flatten them (they will do that themselves if using the helper methods)
       *
       * @param recipes
       * @returns {Array}
       */

    }, {
      key: "toTasks",
      value: function toTasks(recipes) {
        var tasks = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

        this.debugDump('toTasks: recipes', recipes);

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = recipes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var recipe = _step.value;

            //this.debugDump(`recipe taskName[${recipe.taskName? recipe.taskName() : ''}] isArray[${Array.isArray(recipe)}]`, recipe)
            if (Array.isArray(recipe)) {
              tasks.push(this.toTasks(recipe, []));
            } else {
              var taskName = this.toTask(recipe);
              tasks.push(taskName);
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

        return tasks;
      }
    }]);
    return Recipes;
  }(Base);

  /**
   *
   * @param recipes - (recipes or task fns, or task names)
   */
  var parallel = function parallel(gulp) {
    for (var _len = arguments.length, recipes = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      recipes[_key - 1] = arguments[_key];
    }

    var parallel = gulp.parallel(new Recipes().toTasks(recipes));

    // hack to attach the recipes for inspection by aggregate
    parallel.recipes = recipes;
    return parallel;
  };

  var Default$21 = {
    debug: false,
    watch: false,
    presetType: 'macro',
    task: {
      name: 'clean',
      description: 'Cleans images, stylesheets, and javascripts.'
    }
  };

  var Clean = function (_Aggregate) {
    babelHelpers.inherits(Clean, _Aggregate);


    /**
     *
     * @param gulp - gulp instance
     * @param config - customized overrides
     */

    function Clean(gulp, preset) {
      babelHelpers.classCallCheck(this, Clean);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      var config = Preset.resolveConfig.apply(Preset, [preset, Default$21].concat(configs));
      var recipes = parallel(gulp, new (Function.prototype.bind.apply(CleanImages, [null].concat([gulp, preset], configs)))(), new (Function.prototype.bind.apply(CleanStylesheets, [null].concat([gulp, preset], configs)))(), new (Function.prototype.bind.apply(CleanJavascripts, [null].concat([gulp, preset], configs)))(), new (Function.prototype.bind.apply(CleanDigest, [null].concat([gulp, preset], configs)))());

      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Clean).call(this, gulp, config.task.name, recipes, config));
    }

    return Clean;
  }(Aggregate);

  var Default$22 = {
    debug: false,
    presetType: 'postProcessor',
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
     * @param configs - customized overrides for this recipe
     */

    function Rev(gulp, preset) {
      babelHelpers.classCallCheck(this, Rev);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Rev).call(this, gulp, preset, extend.apply(undefined, [true, {}, Default$22].concat(configs))));

      _this.browserSync = BrowserSync.create();
      return _this;
    }

    babelHelpers.createClass(Rev, [{
      key: 'createDescription',
      value: function createDescription() {
        return 'Adds revision digest to assets from ' + this.config.source.options.cwd + '/' + this.config.source.glob;
      }
    }, {
      key: 'run',
      value: function run(done) {
        var _this2 = this;

        var watching = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];


        // FIXME merge in the clean as a task

        return this.gulp.src(this.config.source.glob, this.config.source.options)
        //.pipe(changed(this.config.dest)) // ignore unchanged files
        .pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(rev(this.config.options)).pipe(this.gulp.dest(this.config.dest)).pipe(rev.manifest()).pipe(this.gulp.dest(this.config.dest)).on('error', function (error) {
          _this2.notifyError(error, done, watching);
        }).pipe(this.browserSync.stream());
      }
    }]);
    return Rev;
  }(BaseRecipe);

  var Default$23 = {
    debug: false,
    presetType: 'postProcessor',
    task: {
      name: 'cssNano'
    },
    watch: {
      glob: ['**/*.css'],
      options: {
        //cwd: ** resolved from preset **
      }
    },
    source: {
      glob: ['**/*.css', '!**/*.min.css'],
      options: {
        //cwd: ** resolved from preset **
      }
    },
    options: {
      //autoprefixer: false // assume this is done with Sass recipe
    }
  };

  /**
   * Recipe to be run after Rev or any other that places final assets in the digest destination directory
   */
  var CssNano = function (_BaseRecipe) {
    babelHelpers.inherits(CssNano, _BaseRecipe);


    /**
     *
     * @param gulp - gulp instance
     * @param preset - base preset configuration - either one from preset.js or a custom hash
     * @param configs - customized overrides for this recipe
     */

    function CssNano(gulp, preset) {
      babelHelpers.classCallCheck(this, CssNano);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      var _this = babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(CssNano).call(this, gulp, preset, extend.apply(undefined, [true, {}, Default$23].concat(configs))));

      _this.browserSync = BrowserSync.create();
      return _this;
    }

    babelHelpers.createClass(CssNano, [{
      key: 'createDescription',
      value: function createDescription() {
        return 'Minifies digest css from ' + this.config.source.options.cwd + '/' + this.config.source.glob;
      }
    }, {
      key: 'run',
      value: function run(done) {
        var _this2 = this;

        var watching = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];


        return this.gulp.src(this.config.source.glob, this.config.source.options).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(extReplace('.min.css')).pipe(cssnano(this.config.options)).pipe(this.gulp.dest(this.config.dest)).on('error', function (error) {
          _this2.notifyError(error, done, watching);
        }).pipe(this.browserSync.stream());
      }
    }]);
    return CssNano;
  }(BaseRecipe);

  var Default$24 = {
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
     * @param configs - customized overrides for this recipe
     */

    function Mocha(gulp, preset) {
      babelHelpers.classCallCheck(this, Mocha);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      // resolve watch cwd based on test cwd
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Mocha).call(this, gulp, preset, extend.apply(undefined, [true, {}, Default$24, { watch: { options: { cwd: Preset.resolveConfig.apply(Preset, [preset, Default$24].concat(configs)).test.options.cwd } } }].concat(configs))));
    }

    babelHelpers.createClass(Mocha, [{
      key: 'createDescription',
      value: function createDescription() {
        return 'Tests ' + this.config.test.options.cwd + '/' + this.config.test.glob;
      }
    }, {
      key: 'run',
      value: function run(done) {
        var _this2 = this;

        var watching = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

        var bundle = this.gulp.src(this.config.test.glob, this.config.test.options).pipe(gulpif(this.config.debug, debug(this.debugOptions()))).pipe(mocha({ reporter: 'nyan' })) // gulp-mocha needs filepaths so you can't have any plugins before it
        .on('error', function (error) {
          _this2.notifyError(error, done, watching);
        });

        return bundle;
      }
    }]);
    return Mocha;
  }(BaseRecipe);

  /**
   *  This is the base for publish recipes using BuildControl
   */
  var Default$26 = {

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
      var _Object$getPrototypeO;

      babelHelpers.classCallCheck(this, BasePublish);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      // use the dir as the cwd to the BuildControl class

      var _this = babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(BasePublish)).call.apply(_Object$getPrototypeO, [this, gulp, preset, Default$26].concat(configs)));

      _this.config.options = extend(true, { debug: _this.config.debug, cwd: _this.config.dir }, _this.config.options);
      return _this;
    }

    return BasePublish;
  }(BaseRecipe);

  var Default$25 = {
    task: {
      name: 'prepublish',
      description: 'Checks tag name and ensures directory has all files committed.'
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
      babelHelpers.classCallCheck(this, Prepublish);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Prepublish).call(this, gulp, preset, extend.apply(undefined, [true, {}, Default$25].concat(configs))));
    }

    babelHelpers.createClass(Prepublish, [{
      key: 'run',
      value: function run(done) {
        var buildControl$$ = new buildControl.BuildControl(this.config.options);
        buildControl$$.prepublishCheck();

        this.donezo(done);
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
  var Default$27 = {
    //debug: true,
    npm: {
      bump: true,
      publish: true
    },
    readme: {
      enabled: true,
      name: 'README.md',
      template: '# %sourceName%\n\n%sourceTagLink% built from commit %sourceCommitLink% on branch `%sourceBranch%`. See the [README](../..) for more details\n\n---\n<sup>Built and published by [gulp-pipeline](https://github.com/alienfast/gulp-pipeline) using [build-control](https://github.com/alienfast/build-control)</sup>\n'
    },
    task: {
      name: 'publishBuild',
      description: 'Assembles and pushes the build to a branch'
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
      var _Object$getPrototypeO;

      babelHelpers.classCallCheck(this, PublishBuild);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(PublishBuild)).call.apply(_Object$getPrototypeO, [this, gulp, preset, Default$27].concat(configs)));
    }

    babelHelpers.createClass(PublishBuild, [{
      key: 'run',
      value: function run(done) {
        var buildControl$$ = new buildControl.BuildControl(this.config.options);

        // bump the version and commit to git
        if (this.config.npm.bump) {
          buildControl$$.npm.bump();
        }

        this.prepareBuildFiles();

        this.generateReadme(buildControl$$);

        // run the commit/tagging/pushing
        buildControl$$.run();

        // publish to npm
        if (this.config.npm.publish) {
          buildControl$$.npm.publish();
        }

        done();
      }
    }, {
      key: 'generateReadme',
      value: function generateReadme(buildControl$$) {
        // generate a readme on the branch if one is not copied in.
        if (this.config.readme.enabled) {
          var readme = path.join(this.config.dir, this.config.readme.name);
          if (fs$1.existsSync(readme)) {
            this.log('Found readme at ' + readme + '.  Will not generate a new one from the template.  Turn this message off with { readme: {enabled: false} }');
          } else {
            fs$1.writeFileSync(readme, buildControl$$.interpolate(this.config.readme.template));
          }
        }
      }

      /**
       * Copy all the configured sources to the config.dir directory
       */

    }, {
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
            // defaulted in BasePublish
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
            // defaulted in BasePublish

            this.log('Copying ' + fileGlob + '...');
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
              for (var _iterator4 = glob.sync(fileGlob, { realpath: true })[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var fromFullPath = _step4.value;

                var _from = path.relative(process.cwd(), fromFullPath);
                var _to = path.join(buildDir, _from);
                this.log('\t...to ' + _to);
                fs$1.copySync(_from, _to);
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

  var Default$28 = {
    task: {
      name: 'publishNpm',
      description: 'Publishes package on npm'
    },
    options: {}
  };

  /**
   *  This recipe will run execute `npm publish` with no other checks.
   *
   *  @see also PublishBuild - it will bump, publish build, and publish npm (all in one)
   */
  var PublishNpm = function (_BasePublish) {
    babelHelpers.inherits(PublishNpm, _BasePublish);


    /**
     *
     * @param gulp - gulp instance
     * @param config - customized overrides
     */

    function PublishNpm(gulp, preset) {
      var _Object$getPrototypeO;

      babelHelpers.classCallCheck(this, PublishNpm);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(PublishNpm)).call.apply(_Object$getPrototypeO, [this, gulp, preset, Default$28].concat(configs)));
    }

    babelHelpers.createClass(PublishNpm, [{
      key: 'run',
      value: function run(done) {
        var npm = new buildControl.Npm(this.config.options);
        npm.publish();
        this.donezo(done);
      }
    }]);
    return PublishNpm;
  }(BasePublish);

  /**
   *  This recipe will keep your source branch clean but allow you to easily push your
   *  _gh_pages files to the gh-pages branch.
   */
  var Default$29 = {
    //debug: true,
    task: {
      name: 'publishGhPages',
      description: 'Publishes a _gh_pages directory to gh-pages branch'
    },
    options: {
      cwd: '_gh_pages',
      branch: 'gh-pages',
      tag: false, // no tagging on gh-pages push
      clean: { // no cleaning of cwd, it is built externally
        before: false,
        after: true // we create a git repo, and without cleaning, subsequent runs will fail with "uncommitted changes"
      }
    }
  };

  var PublishGhPages = function (_BasePublish) {
    babelHelpers.inherits(PublishGhPages, _BasePublish);


    /**
     *
     * @param gulp - gulp instance
     * @param config - customized overrides
     */

    function PublishGhPages(gulp, preset) {
      var _Object$getPrototypeO;

      babelHelpers.classCallCheck(this, PublishGhPages);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(PublishGhPages)).call.apply(_Object$getPrototypeO, [this, gulp, preset, Default$29].concat(configs)));
    }

    babelHelpers.createClass(PublishGhPages, [{
      key: 'run',
      value: function run(done) {
        var buildControl$$ = new buildControl.BuildControl(this.config.options);

        // run the commit/tagging/pushing
        buildControl$$.run();

        done();
      }
    }]);
    return PublishGhPages;
  }(BasePublish);

  var Default$30 = {
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
  };

  var Jekyll = function (_BaseRecipe) {
    babelHelpers.inherits(Jekyll, _BaseRecipe);


    /**
     *
     * @param gulp - gulp instance
     * @param config - customized overrides
     */

    function Jekyll(gulp, preset) {
      var _Object$getPrototypeO;

      babelHelpers.classCallCheck(this, Jekyll);

      for (var _len = arguments.length, configs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        configs[_key - 2] = arguments[_key];
      }

      return babelHelpers.possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(Jekyll)).call.apply(_Object$getPrototypeO, [this, gulp, preset, Default$30].concat(configs)));
    }

    babelHelpers.createClass(Jekyll, [{
      key: 'run',
      value: function run(done) {
        var config = '--config ' + this.config.options.config;

        var rawConfigFile = this.rawConfig();

        // If raw is specified, add the temporary config file to the list of configs passed into the jekyll command
        if (rawConfigFile) {
          config += ',' + rawConfigFile;
        }

        this.exec(Ruby.localPath('rubyRunner.sh') + ' ' + this.config.options.baseCommand + ' jekyll build ' + config);

        this.donezo(done);
      }

      // Create temporary config file if needed

    }, {
      key: 'rawConfig',
      value: function rawConfig() {
        if (this.config.options.raw) {
          // Tmp file is only available within the context of this function
          var tmpFile = tmp.fileSync({ prefix: '_config.', postfix: '.yml' });

          // Write raw to file
          fs$1.writeFileSync(tmpFile.name, this.config.options.raw);

          // return the file path
          return tmpFile.name;
        } else {
          return null;
        }
      }
    }]);
    return Jekyll;
  }(BaseRecipe);

  /**
   *
   * @param recipes - (recipes or task fns, or task names)
   */
  var series = function series(gulp) {
    for (var _len = arguments.length, recipes = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      recipes[_key - 1] = arguments[_key];
    }

    var series = gulp.series(new Recipes().toTasks(recipes));

    // hack to attach the recipes for inspection by aggregate
    series.recipes = recipes;
    return series;
  };

  var Default$31 = {
    debug: false,
    watch: false,
    presetType: 'macro',
    task: false
  };

  /**
   * Sleep the given ms value.
   */
  var Sleep = function (_BaseRecipe) {
    babelHelpers.inherits(Sleep, _BaseRecipe);


    /**
     *
     * @param gulp - gulp instance
     * @param config - customized overrides
     */

    function Sleep(gulp, preset, sleep) {
      babelHelpers.classCallCheck(this, Sleep);
      return babelHelpers.possibleConstructorReturn(this, Object.getPrototypeOf(Sleep).call(this, gulp, preset, Default$31, { sleep: sleep }));
    }

    babelHelpers.createClass(Sleep, [{
      key: 'createDescription',
      value: function createDescription() {
        return 'Sleeps for ' + this.config.sleep + ' milliseconds.';
      }
    }, {
      key: 'run',
      value: function run(done) {
        var _this2 = this;

        setTimeout(function () {
          // eslint-disable-line no-undef
          _this2.donezo(done);
        }, this.config.sleep);
      }
    }]);
    return Sleep;
  }(BaseRecipe);

  exports.Preset = Preset;
  exports.Rails = Rails;
  exports.EsLint = EsLint;
  exports.Uglify = Uglify;
  exports.Autoprefixer = Autoprefixer;
  exports.Images = Images;
  exports.Sass = Sass;
  exports.ScssLint = ScssLint;
  exports.Aggregate = Aggregate;
  exports.RollupEs = RollupEs;
  exports.RollupCjs = RollupCjs;
  exports.RollupCjsBundled = RollupCjsBundled;
  exports.RollupIife = RollupIife;
  exports.RollupAmd = RollupAmd;
  exports.RollupUmd = RollupUmd;
  exports.Copy = Copy;
  exports.CleanImages = CleanImages;
  exports.CleanStylesheets = CleanStylesheets;
  exports.CleanJavascripts = CleanJavascripts;
  exports.CleanDigest = CleanDigest;
  exports.Clean = Clean;
  exports.Rev = Rev;
  exports.CssNano = CssNano;
  exports.Mocha = Mocha;
  exports.Prepublish = Prepublish;
  exports.PublishBuild = PublishBuild;
  exports.PublishNpm = PublishNpm;
  exports.PublishGhPages = PublishGhPages;
  exports.Jekyll = Jekyll;
  exports.series = series;
  exports.parallel = parallel;
  exports.Sleep = Sleep;

});
//# sourceMappingURL=gulp-pipeline.amd.js.map