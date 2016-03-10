import BaseRecipe from './baseRecipe'
import BrowserSync from 'browser-sync'
import debug from 'gulp-debug'
import extend from 'extend'
import gulpif from 'gulp-if'
import rev   from 'gulp-rev'

export const Default = {
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
}

const Rev = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default, ...configs))
    this.browserSync = BrowserSync.create()
  }

  createDescription() {
    return `Adds revision digest to assets from ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(watching = false) {

    // FIXME merge in the clean as a task


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

export default Rev
