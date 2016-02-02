import gulp from 'gulp'
import Platform from './src/presets'
import EsLint from './src/eslint'
import RollupEs from './src/rollupEs'
import RollupAmd from './src/rollupAmd'
import RollupCjs from './src/rollupCjs'
import RollupUmd from './src/rollupUmd'
import RollupIife from './src/rollupIife'
import TaskSequence from './src/taskSequence'



// Let's eat our own dogfood and use our own recipes to generate our dist packages
let platform = Platform.nodeSrc()


// NOTE: it's overkill to generate all of these, but what the hell, it's a fair example.

// instantiate ordered array of recipes (for each instantiation the tasks will be created e.g. rollup:es and rollup:es:watch)
let recipes = [
  new EsLint(gulp, platform),
  new RollupEs(gulp, platform, {options: {dest: 'dist/gulp-pipeline.es.js'}}),
  new RollupAmd(gulp, platform, {options: {dest: 'dist/gulp-pipeline.amd.js'}}),
  new RollupCjs(gulp, platform, {options: {dest: 'dist/gulp-pipeline.cjs.js'}}),
  new RollupUmd(gulp, platform, {options: {dest: 'dist/gulp-pipeline.umd.js', moduleName: 'gulpPipeline'}}),
  new RollupIife(gulp, platform, {options: {dest: 'dist/gulp-pipeline.iife.js', moduleName: 'gulpPipeline'}}),
]


// Simple helper to create the default and watch tasks as a sequence of the recipes already defined
new TaskSequence(gulp, 'default', recipes)
new TaskSequence(gulp, 'watch', recipes, {watch: true})
