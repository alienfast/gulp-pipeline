import gulp from 'gulp'
import extend from 'extend'
import { rollup } from 'rollup'
//import babel from 'rollup-plugin-babel';

//import NodeSrc from './src/platform'
import Platform from './src/platform'
import RollupEs from './src/rollupEs'



//let rollupBaseSettings = {
//  entry: 'src/index.js',
//  //plugins: [],
//  sourceMap: true,
//  format: 'es6',
//}
//
//gulp.task('rollup:es2015', () => {
//  let settings = extend(true, {}, rollupBaseSettings, {dest: 'dist/gulp-pipeline.es2015.js'})
//  return rollup(settings).then((bundle) => {
//    return bundle.write(settings)
//  })
//})
//
//gulp.task('rollup:cjs', () => {
//  let settings = extend(true, {}, rollupBaseSettings, {
//    dest: 'dist/gulp-pipeline.cjs.js',
//    format: 'cjs',
//    plugins: [babel({
//      babelrc: false,
//      presets: ['es2015-rollup']
//    })]
//  })
//  return rollup(settings).then((bundle) => {
//    return bundle.write(settings)
//  })
//})
//
//gulp.task('rollup', ['rollup:es2015', 'rollup:cjs'])


//let rollupConfig = {
//  source: {options: {cwd: './src'}}
//}

let platform = Platform.nodeSrc()

//console.log(`platform`, platform)

// es2015
let es = new RollupEs(gulp, platform, {options: {dest: 'dist/gulp-pipeline.es.js'}})


let manual =
{
  entry: '/Users/kross/projects/gulp-pipeline/src/index.js',
  onwarn: (message) => {
    console.error(`foo: ${message}`);
  },
  sourceMap: true,
  format: 'es6',
  dest: 'dist/gulp-pipeline.es.js'
}

gulp.task('manual', () => {
  return rollup(manual).then((bundle) => {
    return bundle.write(manual)
  })
})
