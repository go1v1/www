import autoprefixer from 'gulp-autoprefixer'
import babelify from 'babelify'
import browserify from 'browserify'
import browserSync from 'browser-sync'
import dotenv from 'dotenv'
import exorcist from 'exorcist'
import gulp from 'gulp'
import gutil from 'gulp-util'
import history from 'connect-history-api-fallback'
import rename from 'gulp-rename'
import replace from 'gulp-replace'
import sass from 'gulp-sass'
import source from 'vinyl-source-stream'
import watchify from 'watchify'
import { spawn } from 'child_process'

const sync = browserSync.create()

function notify(err) {
  sync.notify(err.message)
}

gulp.task('set-env:production', () => {
  dotenv.load({ path: '.env.production' })
})

gulp.task('styles', () => {
  gulp.src('styles/index.scss')
    .pipe(sass().on('error', sass.logError).on('error', notify))
    .pipe(autoprefixer())
    .pipe(rename('app.css'))
    .pipe(gulp.dest('dist'))
    .pipe(sync.stream())
})

gulp.task('markup', () => {
  gulp.src('markup/*.html')
    .pipe(replace('${baseUrl}', process.env.GO1V1_BASEURL || '/'))
    .pipe(replace('${environment}', JSON.stringify({
      baseUrl: process.env.GO1V1_BASEURL || '/'
    })))
    .pipe(gulp.dest('dist'))
    .pipe(sync.stream())
})

gulp.task('scripts', () => {
  watchify.args.debug = true

  let bundler = browserify('./src/index.js', watchify.args)
  .transform(babelify.configure({
    sourceMapRelative: process.cwd(),
    externalHelpers: true,
    optional: ['es7.decorators', 'es7.functionBind']
  }))
  bundler.on('update', bundle)

  if (gulp.seq.find(task => 'dev' === task)) {
    bundler = watchify(bundler)
  }

  function bundle() {
    bundler
      .bundle()
      .on('error', logBundlerError)
      .pipe(exorcist('dist/app.js.map'))
      .pipe(source('app.js'))
      .pipe(gulp.dest('dist'))
      .pipe(sync.stream({ once: true }))
  }

  function logBundlerError(err) {
    err.message = err.message.replace(':', '\n')
    err.message = err.message.replace(/(.*) \((.*)\)/, '  $2 $1')
    let message = new gutil.PluginError('browserify', `${err.message}\n${err.codeFrame}`).toString();
    process.stderr.write(message + '\n');
    notify(err)
  }

  bundle()
})

gulp.task('build', ['styles', 'markup', 'scripts'])

gulp.task('build:production', ['set-env:production', 'build'])

gulp.task('dev', ['build'], () => {
  sync.init({
    ghostMode: false,
    open: false,
    server: {
      baseDir: 'dist',
      middleware: [ history() ]
    }
  })

  gulp.watch('./styles/{,*/}*.scss', ['styles'])
  gulp.watch('./markup/*.html', ['markup'])
})

gulp.task('deploy', ['build:production'], () => {
  spawn('git', 'subtree push --prefix dist origin gh-pages'.split(' '), {
    stdio: ['ignore', process.stdout, process.stderr]
  })
})

gulp.task('default', ['dev'])
