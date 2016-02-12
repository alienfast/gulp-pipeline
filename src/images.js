import BaseRecipe from './baseRecipe'
import BrowserSync from 'browser-sync'
import debug from 'gulp-debug'
import extend from 'extend'
import gulpif from 'gulp-if'
import changed    from 'gulp-changed'
import imagemin   from 'gulp-imagemin'
import merge from 'merge-stream'
import path from 'path'

export const Default = {
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
}

const Images = class extends BaseRecipe {

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
    return `Minifies change images from ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(watching = false) {

    var tasks = this.config.source.baseDirectories.map((baseDirectory) => {
      // join the base dir with the relative cwd
      return this.runOne(path.join(baseDirectory, this.config.source.options.cwd), watching)
    })
    return merge(tasks);
  }

  runOne(cwd, watching) {

    // setup a run with a single cwd a.k.a base directory FIXME: perhaps this could be in the base recipe? or not?
    let options = extend({}, this.config.source.options)
    options.cwd = cwd

    return this.gulp.src(this.config.source.glob, options)
      .pipe(changed(this.config.dest)) // ignore unchanged files
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(imagemin(this.config.options))
      .on('error', (error) => {
        this.notifyError(error, watching)
      })
      .pipe(this.gulp.dest(this.config.dest))
      .pipe(this.browserSync.stream())
  }
}

export default Images
