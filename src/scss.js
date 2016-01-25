import BaseRecipe from './baseRecipe'
import autoprefixer from 'gulp-autoprefixer'
import extend from 'extend'
import sass from 'gulp-sass'
import sourcemaps from 'gulp-sourcemaps'
import BrowserSync from 'browser-sync'

// TODO: scsslint

const Scss = (() => {

  const Default = {
    task: 'scss',
    watch: './app/assets/stylesheets/**/*.scss',
    source: './app/assets/stylesheets/application.scss',
    dest: 'public/stylesheets',
    options: {
      indentedSyntax: true,
      errLogToConsole: true,
      includePaths: ['node_modules']
    },
    autoprefixer: {
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
  }

  /**
   * ----------------------------------------------
   * Class Definition
   * ----------------------------------------------
   */
  class Scss extends BaseRecipe {

    /**
     *
     * @param gulp
     * @param config
     */
    constructor(gulp, config = {}) {
      super(gulp, extend(true, {}, Default, config))
      this.browserSync = BrowserSync.create()
    }

    run() {
      return this.gulp.src(this.config.source)
        .pipe(sourcemaps.init())
        .pipe(sass(this.config.options))
        .pipe(sourcemaps.write())
        .pipe(autoprefixer(this.config.autoprefixer.options))
        .pipe(this.gulp.dest(this.config.dest))
        .pipe(this.browserSync.stream())
    }

    // ----------------------------------------------
    // protected

    // ----------------------------------------------
    // private

    // ----------------------------------------------
    // static

  }

  return Scss

})()

export default Scss
