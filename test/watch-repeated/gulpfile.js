var gulp = require('gulp');
var sass = require('gulp-sass');

var t = function (done) {
  return gulp.src(['*.scss', '!_*.scss'], {cwd: 'scss'})
    .pipe(sass())
    .on('error', (error) => {
      done(error)
    })
    .pipe(gulp.dest('./dist'));
}

gulp.task('sass', t)

gulp.task('sass:watch', () => {
  gulp.watch('**/*.scss', {cwd: 'scss'}, t);
})
