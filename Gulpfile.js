var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var del = require('del');

var paths = {
    less: ['./src/css/less/*.less'],
    js: ['./src/js/*.js'],
    font: './src/fonts/**',
    img: './src/img/**',
    html: './src/*.html',
    dist: {
        css: './dist/css/',
        js: './dist/js/',
        html: './dist/',
        font: './dist/fonts',
        img: './dist/img'
    }
};

var port = 1337;

gulp.task('connect', function() {
    plugins.connect.server({
        root: 'src',
        port: port
    });
    gulp.src("src/index.html")
        .pipe(plugins.open('', {url: 'http://localhost:' + port}));
});

gulp.task('connect-dist', function() {
    plugins.connect.server({
        root: 'dist',
        port: port
    });
    gulp.src("dist/index.html")
        .pipe(plugins.open('', {url: 'http://localhost:' + port}));
});

gulp.task('clean', function() {
    del.sync(paths.dist.css);
    del.sync(paths.dist.js);
    del.sync(paths.dist.html);
});

gulp.task('less', function() {
  gulp.src(paths.less)
    .pipe(plugins.concat('main.css'))
    .pipe(plugins.less())
    .pipe(plugins.minifyCss())
    .pipe(plugins.autoprefixer())
    .pipe(gulp.dest(paths.dist.css));
});

gulp.task('less-dev', function() {
  gulp.src(paths.less)
    .pipe(plugins.concat('main.css'))
    .pipe(plugins.less())
    .on('error', function (err) {
        console.log('LESS ERROR : ' + err.message);
        this.emit('end');
    })
    .pipe(plugins.autoprefixer())
    .pipe(gulp.dest('./src/css/'));
});

gulp.task('js', function() {
  gulp.src(paths.js)
    // .pipe(plugins.concat('app.js'))
    .pipe(plugins.uglify({mangle: false}))
    .pipe(gulp.dest(paths.dist.js));
});

gulp.task('font', function() {
  gulp.src(paths.font)
    .pipe(gulp.dest(paths.dist.font));
});

gulp.task('img', function() {
  gulp.src(paths.img)
    .pipe(gulp.dest(paths.dist.img));
});

gulp.task('html', function() {
  gulp.src(paths.html)
    .pipe(gulp.dest(paths.dist.html));
});

gulp.task('bower-install', function () {
    gulp.src('./')
        .pipe(plugins.shell([
            'cp -r src/bower_components dist/bower_components'
        ]));
});

gulp.task('watch', function() {
  gulp.watch(paths.less, ['less-dev']);
  console.log('watching directory:' + paths.less.join(', '));
});

gulp.task('deploy', function () {
    return gulp.src('./dist/**/*')
        .pipe(plugins.ghPages());
});

gulp.task('dev', ['less-dev']);

gulp.task('build', ['clean', 'less', 'js', 'font', 'img', 'html', 'bower-install']);

gulp.task('default', ['dev', 'connect', 'watch']);
