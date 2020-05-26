const gulp = require('gulp');
const sass = require('gulp-sass');
const cleanCSS   = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const gutil = require('gulp-util');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const plumber = require('gulp-plumber');
const browserSync = require('browser-sync');
const shell = require('gulp-shell');
const htmlPartial  = require('gulp-html-partial');
const babel = require('gulp-babel');

//startup the web server and browserSync
//set watchers
function server() { 
    browserSync.init({
        server: {
            baseDir: "src/",
            index: "./index.html"
        },
        options: {
            reloadDelay: 250
        },
        notify: false,
        //browser: "chromium"
    });
    gulp.watch(['./src/scripts/**/*.js', '!./src/scripts/scripts.js'],  script);
    gulp.watch('./src/styles/scss/**/*.scss', style);
    gulp.watch('./src/views/**/*.html', html);
};

//compiling Javascripts
function script() { 
    return gulp.src(['./src/scripts/**/*.js', '!./src/scripts/scripts.js'])
    .pipe(plumber())
    .on('error', gutil.log)
    .pipe(concat('scripts.js'))
    .pipe(gulp.dest('src/scripts'))
    .pipe(browserSync.reload({stream: true}))
};

//compiling Javascripts for deployment
function scriptDeploy() {
    return gulp.src(['./src/scripts/**/*.js', '!./src/scripts/scripts.js'])
    .pipe(plumber())
    .pipe(concat('scripts.js'))
    .pipe(babel({
        presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(gulp.dest('dist/scripts'))
};

//compiling SCSS files
function style() { 
    return gulp.src('src/styles/scss/**/*.scss')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(autoprefixer({
        Browserslist: ['last 2 versions', 'not dead'],
        cascade: true
    }))
    .on('error', gutil.log)
    .pipe(concat('style.css'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('src/styles'))
    .pipe(browserSync.reload({stream: true}))
};

//compiling SCSS files for deployment
function styleDeploy() {
    return gulp.src('src/styles/scss/**/*.scss')
        .pipe(plumber())
        .pipe(sass())
        .pipe(autoprefixer({
            Browserslist: ['last 2 versions', 'not dead'],
            cascade: true
        }))
        .pipe(concat('style.css'))
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist/styles'))
};

//watch and refresh on all HTML file
function html() { 
    return gulp.src('src/views/template/*.html')
    // including HTML files into each other
    .pipe(htmlPartial({
        basePath: 'src/views/partials/'
    }))
    .pipe(plumber())
    .pipe(browserSync.reload({stream: true}))
    .on('error', gutil.log)
    .pipe(gulp.dest('src/'));
};

//migrating html/images/src files for deployment
async function htmlDeploy() {
//files in src folder
    gulp.src('src/*', {nodir: true})
    .pipe(plumber())
    .pipe(gulp.dest('dist'));
//hidden files
    gulp.src('src/.*')
    .pipe(plumber())
    .pipe(gulp.dest('dist'));
//html files
    gulp.src('src/views/template/*.html')
    // including HTML files into each other
    .pipe(htmlPartial({
        basePath: 'src/views/partials/'
    }))    
    .pipe(plumber())
    .pipe(gulp.dest('dist'));
//images
    gulp.src('src/images/**/*.+(png|jpg|gif|svg)')
    .pipe(plumber())
    .pipe(gulp.dest('dist/images'));
};

//cleans dist directory in case things got deleted
async function clean() {
    return shell.task('rm -rf dist');
};

//create folders using shell
async function scaffold() {
    return shell.task([
        'mkdir dist',
        'mkdir dist/scripts',
        'mkdir dist/styles',
        'mkdir dist/images',
    ]);
};

//development tasks
exports.style = style;
exports.script = script;
exports.html = html;
exports.server = server;
const compile = gulp.parallel(script, style, html);
exports.default = gulp.series(compile, server);

//deployment tasks
exports.scriptDeploy = scriptDeploy;
exports.stylesDeploy = styleDeploy;
exports.htmlDeploy = htmlDeploy;
exports.clean = clean;
exports.scaffold = scaffold;
const preDeploy = gulp.series(clean, scaffold);
const deploy = gulp.parallel(scriptDeploy, styleDeploy, htmlDeploy);
exports.deploy = gulp.series(preDeploy, deploy);