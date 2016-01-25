import gulp from 'gulp'
import extend from 'extend'
import { rollup } from 'rollup'

// TODO: may need to integrate babelrc: false instead - https://github.com/rollup/rollup-plugin-babel/issues/35#issuecomment-174253752

//rollup src/index.js --output dist/gulp-pipeline.es2015-cmdline.js --format es6

let rollupBaseSettings = {
  entry: 'src/index.js',
  //plugins: [],
  sourceMap: true,
  format: 'es6',
}

gulp.task('rollup:es2015-promise', () => {
  let settings = extend(true, rollupBaseSettings, {dest: 'dist/gulp-pipeline.es2015-promise.js'})
  return rollup(settings).then((bundle) => {
    return bundle.write(settings)
  })
})

