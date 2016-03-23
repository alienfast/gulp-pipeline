import BaseRecipe from './baseRecipe'
import Preset from './preset'
import extend from 'extend'
import debug from 'gulp-debug'
import gulpif from 'gulp-if'
import revReplace   from 'gulp-rev-replace'

export const Default = {
  debug: false,
  presetType: 'postProcessor',
  task: {
    name: 'rev:replace'
  },
  watch: false,
  source: { // cwd/ignore defaulted from preset set in constructor
    glob: '**'
  },
  manifest: 'rev-manifest.json', // file name only
  options: {}
}

const RevReplace = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param preset - base preset configuration - either one from preset.js or a custom hash
   * @param configs - customized overrides for this recipe
   */
  constructor(gulp, preset, ...configs) {
    let resolvedPreset = Preset.resolveConfig(preset, Default, ...configs)
    super(gulp, preset,
      Default,
      {
        source: {
          options: { // replace everything in the postProcessor dest folder (except manifest)
            cwd: resolvedPreset.dest,
            ignore: [`**/${resolvedPreset.manifest}`]
          }
        }
      },
      ...configs)
  }

  createDescription() {
    return `Adds revision digest to assets from ${this.config.source.options.cwd}/${this.config.source.glob}`
  }

  run(done, watching = false) {

    this.debugDump(`gulp.src ${this.config.source.glob}`, this.config.source.options)

    // options.manifest has to originate from gulp.src
    let options = extend(true, {},
      {
        // full path to the manifest file
        manifest: this.gulp.src(`${this.config.dest}/${this.config.manifest}`)
      },
      this.config.options
    )

    this.debugDump(`revReplace options`, options)

    return this.gulp.src(this.config.source.glob, this.config.source.options)
      .pipe(gulpif(this.config.debug, debug(this.debugOptions())))
      .pipe(revReplace(options))
      .pipe(this.gulp.dest(this.config.dest))
      .on('error', (error) => {
        this.notifyError(error, done, watching)
      })
  }
}

export default RevReplace
