import BaseMocha from './baseMocha'
import mochaPhantomJS from 'gulp-mocha-phantomjs'
import debug from 'gulp-debug'
import gulpif from 'gulp-if'

export const Default = {
  test: {
    glob: 'testrunner.html'
  },
  task: {
    name: 'mocha:phantomjs'
  },
  options: {
    reporter: 'nyan'
  }
}

/*
WARNING: Using this means using a browser, and if your tests are written in ES2015 you need to use rollup first!
*/
const MochaPhantomJs = class extends BaseMocha {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default, ...configs)
  }

  run(done, watching = false) {
    let bundle = this.gulp.src(this.config.test.glob, this.config.test.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(mochaPhantomJS(this.config.options))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })

    return bundle
  }
}

export default MochaPhantomJs
