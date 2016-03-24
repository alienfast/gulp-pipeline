import Base from '../base'
import DefaultRegistry from 'undertaker-registry'
import Util from 'util'
import extend from 'extend'


import {Preset, Clean, CleanDigest, CssNano, Images, Sass, RollupIife, ScssLint, EsLint, Rev, RevReplace, Uglify, Aggregate, parallel, series, tmpDir} from '../index'

// per class name defaults that can be overridden
export const Default = {
  preset: Preset.rails()
}

/**
 * gulp.registry(new RailsRegistry(...configs))
 */
const RailsRegistry = class extends DefaultRegistry {

  /**
   * @param config - customized overrides of the Default, last one wins
   */
  constructor(...configs) {
    super()
    this.config = extend(true, {}, Default, ...configs)
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
    const minifiedAssetsDir = tmpDir()
    //console.log(`Using ******* ${minifiedAssetsDir}`)


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
        // rev all the rest from the debug dir (except the minified application(css|js))
        new Rev(gulp, preset, digests, {
          source: {
            options: {
              ignore: ['**/application.js', '**/*.js.map', '**/application.css']
            }
          }
        }),
        new RevReplace(gulp, preset, digests)
      )
    )

    // default then digest
    new Aggregate(gulp, 'build',
      series(gulp,
        defaultRecipes,
        digest
      )
    )
  }
}

// add all the undertaker properties
Util.inherits(RailsRegistry, DefaultRegistry)

export default RailsRegistry
