import BaseRegistry from './baseRegistry'


import {Preset, Clean, CleanDigest, CssNano, Images, Sass, RollupIife, ScssLint, EsLint, Rev, RevReplace, Uglify, Aggregate, parallel, series, tmpDir, clean} from '../index'

// per class name defaults that can be overridden
export const Default = {
  preset: Preset.rails()
}

/**
 * gulp.registry(new RailsRegistry(...configs))
 */
const RailsRegistry = class extends BaseRegistry {

  /**
   * @param config - customized overrides of the Default, last one wins
   */
  constructor(...configs) {
    super(Default, ...configs)
  }

  init(gulp) {
    const preset = this.config.preset

    const js = new Aggregate(gulp, 'js',
      series(gulp,
        new EsLint(gulp, preset),
        new RollupIife(gulp, preset, {options: {dest: 'application.js', moduleName: 'application'}}, this.config.RollupIife)
      )
    )

    const css = new Aggregate(gulp, 'css',
      series(gulp,
        new ScssLint(gulp, preset),
        new Sass(gulp, preset)
      )
    )

    const defaultRecipes = new Aggregate(gulp, 'default',
      series(gulp,
        new Clean(gulp, preset),
        parallel(gulp,
          new Images(gulp, preset),
          js,
          css
        )
      )
    )

    // Create the production assets
    const tmpDirObj = tmpDir()
    const minifiedAssetsDir = tmpDirObj.name
    this.debug(`tmpDir for minified assets: ${minifiedAssetsDir}`)


    // digests need to be one task, tmpDir makes things interdependent
    const digests = {debug: false, task: false, watch: false}

    const digest = new Aggregate(gulp, 'digest',
      series(gulp,
        new CleanDigest(gulp, preset, digests),

        // minify application.(css|js) to a tmp directory
        parallel(gulp,
          new Uglify(gulp, preset, digests, {dest: minifiedAssetsDir, concat: {dest: 'application.js'}}),
          new CssNano(gulp, preset, digests, {dest: minifiedAssetsDir, minExtension: false})
        ),

        // rev minified css|js from tmp
        new Rev(gulp, preset, digests, {
          source: {
            options: {
              cwd: minifiedAssetsDir
            }
          }
        }),
        // rev all the rest from the debug dir (except the minified application(css|js)) and merge with the previous rev
        new Rev(gulp, preset, digests, {
          source: {
            options: {
              ignore: ['**/application.js', '**/*.js.map', '**/application.css']
            }
          }
        }),

        // rewrite all revised urls in the assets i.e. css, js
        new RevReplace(gulp, preset, digests),

        // cleanup the temp files and folders
        clean(gulp, `${minifiedAssetsDir}/**`)
      )
    )

    // default then digest
    new Aggregate(gulp, 'all',
      series(gulp,
        defaultRecipes,
        digest
      )
    )
  }
}

export default RailsRegistry
