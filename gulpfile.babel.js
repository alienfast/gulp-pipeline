import gulp from 'gulp'
import Preset from './src/preset'
import Clean from './src/clean'
import EsLint from './src/eslint'
import RollupEs from './src/rollupEs'
import RollupAmd from './src/rollupAmd'
import RollupCjs from './src/rollupCjs'
import RollupUmd from './src/rollupUmd'
import RollupIife from './src/rollupIife'
import Aggregate from './src/aggregate'
import series from './src/util/series'
import parallel from './src/util/parallel'

import PublishBuild from './src/publishBuild'
import Prepublish from './src/prepublish'

// Let's eat our own dogfood and use our own recipes to generate our dist packages
const preset = Preset.nodeSrc()

// NOTE: it's overkill to generate all of these, but what the hell, it's a fair example.
// Create our `default` set of recipes as a combination of series tasks with as much parallelization as possible, creates the `default` and `default:watch`
const recipes = new Aggregate(gulp, 'default',
  series(gulp,
    new Clean(gulp, preset),
    new EsLint(gulp, preset),
    parallel(gulp,
      new RollupEs(gulp, preset, {options: {dest: 'gulp-pipeline.es.js'}}),
      new RollupAmd(gulp, preset, {options: {dest: 'gulp-pipeline.amd.js'}}),
      new RollupCjs(gulp, preset, {options: {dest: 'gulp-pipeline.cjs.js'}}),
      new RollupUmd(gulp, preset, {options: {dest: 'gulp-pipeline.umd.js', moduleName: 'gulpPipeline'}})
    )
  )
)

//---------------
// Publish tasks

// `publish`, gives us a `publish:watch` as well if we so desire to use it
new Aggregate(gulp, 'publish',
  series(gulp,
    new Prepublish(gulp, preset), // gives us a quick exit, in case we didn't commit
    recipes,
    new PublishBuild(gulp, preset)
  )
)
