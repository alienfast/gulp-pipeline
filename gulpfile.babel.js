import gulp from 'gulp'
import extend from 'extend'
import Rollup from 'rollup'

//rollup src/index.js --output dist/gulp-pipeline.es2015-cmdline.js --format es6

let rollupBaseSettings = {
  entry: 'src/index.js',
  //plugins: [],
  sourceMap: true,
  format: 'es6',
}

gulp.task('rollup:es2015', () => {
  let settings = extend(true, rollupBaseSettings, {dest: 'dist/gulp-pipeline.es2015.js'})
  Rollup.rollup(settings)
})

gulp.task('rollup:es2015-promise', () => {
  let settings = extend(true, rollupBaseSettings, {dest: 'dist/gulp-pipeline.es2015-promise.js'})
  return Rollup.rollup(settings).then((bundle) => {
    return bundle.write(settings)
  })
})

