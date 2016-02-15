import BaseRecipe from './baseRecipe'
import BrowserSync from 'browser-sync'
import debug from 'gulp-debug'
import extend from 'extend'
import gulpif from 'gulp-if'
//import changed    from 'gulp-changed'
import rev   from 'gulp-rev'

export const Default = {
  debug: true,
  presetType: 'revisions',
  task: {
    name: 'revisions'
  },
  watch: false,
  //{
  //  glob: ['**'],
  //  options: {
  //    //cwd: ** resolved from preset **
  //  }
  //},
  source: {
    glob: '**',
    options: {
      //cwd: ** resolved from preset **
    }
  },
  options: {}
}

const Revisions = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param config - customized overrides for this recipe
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default, config))
    this.browserSync = BrowserSync.create()
  }

  createHelpText() {
    return `Adds revision digest to assets from ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(watching = false) {
    return this.gulp.src(this.config.source.glob, this.config.source.options)
      //.pipe(changed(this.config.dest)) // ignore unchanged files
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(rev(this.config.options))
      .pipe(this.gulp.dest(this.config.dest))
      .pipe(rev.manifest())
      .pipe(this.gulp.dest(this.config.dest))
      .on('error', (error) => {
        this.notifyError(error, watching)
      })
      .pipe(this.browserSync.stream())

  }
}

export default Revisions
