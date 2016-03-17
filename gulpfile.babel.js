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
let preset = Preset.nodeSrc()

// don't bundle our dependencies
let jsOverrides = {debug: false, nodeResolve: {enabled: false}, commonjs: {enabled: false}}

// NOTE: it's overkill to generate all of these, but what the hell, it's a fair example.

// instantiate ordered array of recipes (for each instantiation the tasks will be created e.g. rollup:es and rollup:es:watch)
let recipes = series(gulp,
  new Clean(gulp, preset),
  new EsLint(gulp, preset),
  parallel(gulp,
    new RollupEs(gulp, preset, {options: {dest: 'gulp-pipeline.es.js'}}, jsOverrides),
    new RollupAmd(gulp, preset, {options: {dest: 'gulp-pipeline.amd.js'}}, jsOverrides),
    new RollupCjs(gulp, preset, {options: {dest: 'gulp-pipeline.cjs.js'}}, jsOverrides),
    new RollupUmd(gulp, preset, {options: {dest: 'gulp-pipeline.umd.js', moduleName: 'gulpPipeline'}}, jsOverrides),
    new RollupIife(gulp, preset, {options: {dest: 'gulp-pipeline.iife.js', moduleName: 'gulpPipeline'}}, jsOverrides)
  )
)

// Simple helper to create the `default` and `default:watch` tasks as sequence of the recipes already defined, aggregating watches
new Aggregate(gulp, 'default', recipes, {debug: false})

let buildControlConfig = {
  debug: false,
  options: {}
}

let prepublish = new Prepublish(gulp, preset, buildControlConfig)
let publishBuild = new PublishBuild(gulp, preset, buildControlConfig)
new Aggregate(gulp, 'publish', series(gulp, prepublish, recipes, publishBuild))









// sample
//import Images from './src/images'
//import Sass from './src/sass'
//import ScssLint from './src/scssLint'
//import CleanDigest from './src/cleanDigest'
//import Rev from './src/rev'
//import MinifyCss from './src/minifyCss'
//
//
//// Utilize one of the common configs
//let preset = Preset.rails() // other pre-configured presets: nodeSrc, nodeLib - see preset.js and submit PRs with other common configs
//
//// Instantiate ordered array of recipes (for each instantiation the tasks will be created e.g. sass and sass:watch)
////  Note: these are run by the run-sequence, allowing series and parallel execution
//let recipes = [
//  new Clean(gulp, preset),
//  [
//    new EsLint(gulp, preset),
//    new ScssLint(gulp, preset)
//  ],
//  [
//    new Images(gulp, preset),
//    new Sass(gulp, preset),
//    new RollupEs(gulp, preset, {options: {dest: 'dist/acme.es.js'}}),                        // es
//    new RollupCjs(gulp, preset, {options: {dest: 'dist/acme.cjs.js'}}),                      // commonjs
//    new RollupIife(gulp, preset, {options: {dest: 'dist/acme.iife.js', moduleName: 'acme'}}) // iife self executing bundle for the browser
//  ]
//]
//
//
//// Simple helper to create the `default` and `default:watch` tasks as a series of the recipes already defined
//new Aggregate(gulp, 'default', recipes)
//
//// Create the production digest assets
//let digest = [
//  new CleanDigest(gulp, preset),
//  new Rev(gulp, preset),
//  new MinifyCss(gulp, preset)
//]
//new Aggregate(gulp, 'digest', digest)
