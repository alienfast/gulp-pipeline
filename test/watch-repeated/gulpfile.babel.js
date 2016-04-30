import gulp from 'gulp'
import Preset from '../../src/preset'
import Sass from '../../src/sass'
import gulpSass from 'gulp-sass'
import debug from 'gulp-debug'

const preset = Preset.nodeSrc()

new Sass(gulp, preset) // creates sass and sass:watch

var t = function (done) {
  return gulp.src(['*.scss', '!_*.scss'], {cwd: 'scss'})
    .pipe(debug())
    .pipe(gulpSass())
    .on('error', (error) => {
      done(error)
    })
    .pipe(gulp.dest('./dist'))
}

gulp.task('simple:sass', t)

gulp.task('simple:sass:watch', () => {
  let watcher = gulp.watch('**/*.scss', {cwd: 'scss'}, t)
  watcher.on('error', (error) => {
    console.log(`Error via watcher: ${error}`)
  })

  watcher.on('add', (path) => {
    console.log(`${path} was added, running...`)
  })

  watcher.on('change', (path) => {
    console.log(`${path} was changed, running...`)
  })
  watcher.on('unlink', (path) => {
    console.log(`${path} was deleted, running...`)
  })
})
