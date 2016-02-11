import gulp from 'gulp'
import Preset from './src/preset'
import Clean from './src/clean'
import EsLint from './src/eslint'
import RollupEs from './src/rollupEs'
import RollupAmd from './src/rollupAmd'
import RollupCjs from './src/rollupCjs'
import RollupUmd from './src/rollupUmd'
import RollupIife from './src/rollupIife'
import TaskSeries from './src/taskSeries'


// Let's eat our own dogfood and use our own recipes to generate our dist packages
let preset = Preset.nodeSrc()


// NOTE: it's overkill to generate all of these, but what the hell, it's a fair example.

// instantiate ordered array of recipes (for each instantiation the tasks will be created e.g. rollup:es and rollup:es:watch)
let recipes = [
  new Clean(gulp, preset),
  new EsLint(gulp, preset),
  [
    new RollupEs(gulp, preset, {options: {dest: 'dist/gulp-pipeline.es.js'}}),
    new RollupAmd(gulp, preset, {options: {dest: 'dist/gulp-pipeline.amd.js'}}),
    new RollupCjs(gulp, preset, {options: {dest: 'dist/gulp-pipeline.cjs.js'}}),
    new RollupUmd(gulp, preset, {options: {dest: 'dist/gulp-pipeline.umd.js', moduleName: 'gulpPipeline'}}),
    new RollupIife(gulp, preset, {options: {dest: 'dist/gulp-pipeline.iife.js', moduleName: 'gulpPipeline'}})
  ]
]


// Simple helper to create the `default` and `default:watch` tasks as a sequence of the recipes already defined
new TaskSeries(gulp, 'default', recipes)




// sample
//import Images from './src/images'
//import Sass from './src/sass'
//import ScssLint from './src/scssLint'
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
//new TaskSeries(gulp, 'default', recipes)
