import BaseRecipe from './baseRecipe'
import BrowserSync from 'browser-sync'
import debug from 'gulp-debug'
import extend from 'extend'
import gulpif from 'gulp-if'
import rev   from 'gulp-rev'

export const Default = {
  debug: false,
  presetType: 'postProcessor',
  task: {
    name: 'rev'
  },
  watch: {
    glob: '**',
    options: {
      //cwd: ** resolved from preset **
      ignore: ['**/digest', '**/digest/**', '**/*.map']
    }
  },
  source: {
    glob: '**',
    options: {
      //cwd: ** resolved from preset **
      ignore: ['**/digest', '**/digest/**', '**/*.map']
    }
  },
  options: {
    merge: true,
    path: 'rev-manifest.json'
  }
}

const Rev = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default, ...configs)
    this.browserSync = BrowserSync.create()
  }

  createDescription() {
    return `Adds revision digest to assets from ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {
    this.debugDump(`gulp.src ${this.config.source.glob}`, this.config.source.options)


    // base is not working    https://github.com/sindresorhus/gulp-rev/issues/150
    //let manifestOptions = extend(true, {}, {base: this.config.dest}, this.config.options)

    // workaround
    let manifestOptions = extend(true, {},
      this.config.options,
      {
        base: this.config.dest,
        path: `${this.config.dest}/${this.config.options.path}`
      }
    )

    this.debugDump(`manifestOptions`, manifestOptions)

    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(rev(this.config.options))
      .pipe(this.gulp.dest(this.config.dest))

      // Merge with an existing unless merge == false
      .pipe(rev.manifest(manifestOptions))
      .pipe(this.gulp.dest(this.config.dest))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })
      .pipe(this.browserSync.stream())
  }
}

export default Rev
