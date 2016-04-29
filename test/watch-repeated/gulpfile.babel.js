import gulp from 'gulp'
import Preset from '../../src/preset'
import Sass from '../../src/sass'
import gulpSass from 'gulp-sass'

const preset = Preset.nodeSrc()

new Sass(gulp, preset) // creates sass and sass:watch

var t = function (done) {
  return gulp.src(['*.scss', '!_*.scss'], {cwd: 'scss'})
    .pipe(gulpSass())
    .on('error', (error) => {
      done(error)
    })
    .pipe(gulp.dest('./dist'));
}

gulp.task('simple:sass', t)

gulp.task('simple:sass:watch', () => {
  gulp.watch('**/*.scss', {cwd: 'scss'}, t);
})
