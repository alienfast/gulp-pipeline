import BaseRegistry from './baseRegistry'

import Preset from '../preset'
import Clean from '../clean'
import CleanDigest from '../cleanDigest'
import CssNano from '../cssNano'
import Images from '../images'
import Sass from '../sass'
import RollupAmd from '../rollupAmd'
import RollupIife from '../rollupIife'
import RollupCjs from '../rollupCjs'
import RollupCjsBundled from '../rollupCjsBundled'
import RollupUmd from '../rollupUmd'
import ScssLint from '../scssLint'
import EsLint from '../eslint'
import Rev from '../rev'
import RevReplace from '../revReplace'
import Uglify from '../uglify'
import Aggregate from '../aggregate'
import parallel from '../util/parallel'
import series from '../util/series'
import tmpDir from '../util/tmpDir'
import clean from '../util/clean'

// per class name defaults that can be overridden
export const Default = {
  // Class-based configuration overrides:
  //  - these may be a single config hash or array of config hashes (last hash overrides earlier hashes)
  //  - in some cases, passing false for the class name may be implemented as omitting the registration of the recipe (see implementation of #init for details)
  RollupIife: true, // absent any overrides, build iife
  RollupCjs: false,
  RollupCjsBundled: false,
  RollupAmd: false,
  RollupUmd: false
}

/**
 * gulp.registry(new RailsRegistry(...configs))
 */
const RailsRegistry = class extends BaseRegistry {

  /**
   * @param config - customized overrides of the Default, last one wins
   */
  constructor(...configs) {
    super(Default, {preset: Preset.rails()}, ...configs)
  }

  init(gulp) {
    let preset = this.config.preset

    const js = new Aggregate(gulp, 'js',
      series(gulp,
        this.esLinters(gulp),
        this.rollups(gulp)
      ),
      ...this.keyConfig('js')
    )

    const css = new Aggregate(gulp, 'css',
      series(gulp,
        this.scssLinters(gulp),
        new Sass(gulp, preset, ...this.classConfig(Sass))
      ),
      ...this.keyConfig('css')
    )

    const defaultRecipes = new Aggregate(gulp, 'default',
      series(gulp,
        new Clean(gulp, preset),
        parallel(gulp,
          new Images(gulp, preset, ...this.classConfig(Images)),
          js,
          css
        )
      ),
      ...this.keyConfig('default')
    )

    // Create the production assets
    const tmpDirObj = tmpDir()
    const minifiedAssetsDir = tmpDirObj.name
    this.debug(`tmpDir for minified assets: ${minifiedAssetsDir}`)


    // digests need to be one task, tmpDir makes things interdependent
    const digests = {task: false, watch: false}

    const digest = new Aggregate(gulp, 'digest',
      series(gulp,
        new CleanDigest(gulp, preset, digests),

        // minify application.(css|js) to a tmp directory
        parallel(gulp,
          new Uglify(gulp, preset, digests, {dest: minifiedAssetsDir, concat: {dest: 'application.js'}}, ...this.classConfig(Uglify)),
          new CssNano(gulp, preset, digests, {dest: minifiedAssetsDir, minExtension: false}, ...this.classConfig(CssNano))
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
      ),
      ...this.keyConfig('digest')
    )

    // default then digest
    new Aggregate(gulp, 'all',
      series(gulp,
        defaultRecipes,
        digest
      ),
      ...this.keyConfig('all')
    )
  }

  esLinters(gulp) {
    return new EsLint(gulp, this.config.preset, ...this.classConfig(EsLint))
  }

  scssLinters(gulp){
    return new ScssLint(gulp, this.config.preset, ...this.classConfig(ScssLint))
  }

  rollups(gulp) {
    let preset = this.config.preset
    // javascripts may have two different needs, one standard iife, and one cjs for rails engines
    let rollups = []

    // All rails apps need the iife which is ultimately the application.js.
    //  Some rails engines may want it only for the purpose of ensuring that libraries can be included properly otherwise the build breaks (a good thing)
    if (this.config.RollupIife) {
      rollups.push(
        new RollupIife(gulp, preset, {
          options: {
            dest: 'application.js',
            moduleName: 'App'
          }
        }, ...this.classConfig(RollupIife))
      )
    }

    // Rails apps probably don't need commonjs, so by default it is off.
    //  Rails engines DO need commonjs, it is consumed by the rails app like any other node library.
    if (this.config.RollupCjs) {
      rollups.push(
        new RollupCjs(gulp, preset, {
          options: {
            dest: 'application.cjs.js',
            moduleName: 'App'
          }
        }, ...this.classConfig(RollupCjs))
      )
    }

    if (this.config.RollupCjsBundled) {
      rollups.push(
        new RollupCjsBundled(gulp, preset, {
          options: {
            dest: 'application.cjs-bundled.js',
            moduleName: 'App'
          }
        }, ...this.classConfig(RollupCjsBundled))
      )
    }

    if (this.config.RollupUmd) {
      rollups.push(
        new RollupUmd(gulp, preset, {
          options: {
            dest: 'application.umd.js',
            moduleName: 'App'
          }
        }, ...this.classConfig(RollupUmd))
      )
    }

    if (this.config.RollupAmd) {
      rollups.push(
        new RollupAmd(gulp, preset, {
          options: {
            dest: 'application.amd.js',
            moduleName: 'App'
          }
        }, ...this.classConfig(RollupAmd))
      )
    }

    return parallel(gulp,
      ...rollups
    )
  }
}

export default RailsRegistry
