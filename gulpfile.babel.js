import gulp from 'gulp'
import babel from 'rollup-plugin-babel'
import rename from 'gulp-rename'
import rollup from 'rollup-stream'
import source from 'vinyl-source-stream'
import sourcemaps from 'gulp-sourcemaps'
import buffer from 'vinyl-buffer'

//gulp.task('default', [scss.taskName(), javascript.taskName()])
//gulp.task('watch', [scss.watchTaskName(), javascript.watchTaskName()])

// TODO: Lint by eating our own dogfood here

// rollup -c -f cjs -o dist/gulp-pipeline.cjs.js
// rollup -c -f es6 -o dist/gulp-pipeline.es6.js",



gulp.task('rollup:es6', () => {
  let settings = {
    entry: './lib/index.js',
    sourceMap: true,
    plugins: [babel()],

    format: 'es6',
    dest: 'dist/gulp-pipeline.es6.js'
  };

  return rollup(settings)
    .pipe(source('index.js', './lib')) // if you want to output with a different name, rename it at the end using gulp-rename.
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true})) // tell gulp-sourcemaps to load the inline sourcemap produced by rollup-stream.
    .pipe(sourcemaps.write('.')) // write the sourcemap alongside the output file.

    //.pipe(rename(outputFile))

    .pipe(gulp.dest('./dist')) // output to ./dist/main.js as normal.
})
