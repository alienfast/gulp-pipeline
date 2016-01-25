import gulp from 'gulp'
import extend from 'extend'
import { rollup } from 'rollup'
import babel from 'rollup-plugin-babel';


// TODO: may need to integrate babelrc: false instead - https://github.com/rollup/rollup-plugin-babel/issues/35#issuecomment-174253752

//rollup src/index.js --output dist/gulp-pipeline.es2015-cmdline.js --format es6

let rollupBaseSettings = {
  entry: 'src/index.js',
  //plugins: [],
  sourceMap: true,
  format: 'es6',
}

gulp.task('rollup:es2015', () => {
  let settings = extend(true, {}, rollupBaseSettings, {dest: 'dist/gulp-pipeline.es2015.js'})
  return rollup(settings).then((bundle) => {
    return bundle.write(settings)
  })
})

gulp.task('rollup:cjs', () => {
  let settings = extend(true, {}, rollupBaseSettings, {
    dest: 'dist/gulp-pipeline.cjs.js',
    format: 'cjs',
    plugins: [babel({
      babelrc: false,
      presets: ['es2015-rollup']
    })]
  })
  return rollup(settings).then((bundle) => {
    return bundle.write(settings)
  })
})

gulp.task('rollup', ['rollup:es2015', 'rollup:cjs'])
