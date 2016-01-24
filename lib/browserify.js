import BaseRecipe from './baseRecipe'
import EsLint from './eslint'
import BrowserSync from 'browser-sync'
import babelify from 'babelify'
import browserify from 'browserify'
import extend from 'extend'
import source from 'vinyl-source-stream'
import watchify from 'watchify'
import util from 'gulp-util'

// TODO: sourcemaps

const Browserify = (() => {

  const Default = {
    task: 'browserify',
    watch: './app/assets/javascripts/**/*.js',
    source: './app/assets/javascripts/index.js',
    dest: './public/assets',
    browserify: {
      options: {
        debug: true
      }
    }
  }

  /**
   * ----------------------------------------------
   * Class Definition
   * ----------------------------------------------
   */
  class Browserify extends BaseRecipe {

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
      this.bundler = watchify(browserify(this.config.browserify.options).transform(babelify))
    }

    run() {
      new EsLint(this.gulp, {source: this.config.source}).run()
      this.bundler.bundle()
        .on('error', util.log.bind(util, 'Browserify Error'))
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

  return Browserify

})()

export default Browserify
