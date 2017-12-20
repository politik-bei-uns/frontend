require('es6-promise').polyfill();

// Defining base pathes
var basePaths = {
    packages: './node_modules/',
    temp: './tmp/',
    target: './static/',
    assets: './assets/'
};

// requirements
var gulp = require('gulp');
var concat = require('gulp-concat');
var cssnano = require('gulp-cssnano');
var googleWebFonts = require('gulp-google-webfonts');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var rimraf = require('gulp-rimraf');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');


// gulp watch
gulp.task('watch', function () {
    // JS
    gulp.watch(basePaths.assets + 'js/*.js', ['copy-assets-webapp-js', 'concat-js']);
    // CSS
    gulp.watch(basePaths.assets + 'sass/*.scss', ['copy-assets-webapp-css', 'sass', 'concat-css']);
});

/*
 *
 */
gulp.task('copy-assets-webapp-css', [], function () {
    return gulp.src(basePaths.assets + 'sass/**/*.scss')
        .pipe(gulp.dest(basePaths.temp + 'sass/webapp/'));
});

/*
 *
 */
gulp.task('sass', ['copy-assets-webapp-css'], function () {
    return gulp.src(basePaths.temp + 'sass/*.scss')
        .pipe(plumber())
        .pipe(sass({noCache: true}))
        .pipe(gulp.dest(basePaths.temp + 'css/'));
});

/*
 *
 */
gulp.task('concat-css', ['copy-assets-webapp-css', 'sass'], function () {
    return gulp.src(basePaths.temp + 'css/base.css')
        .pipe(plumber())
        .pipe(rename({suffix: '.min'}))
        //.pipe(cssnano({discardComments: {removeAll: true}})) // comment out for devel
        .pipe(concat('webapp.min.css'))
        .pipe(gulp.dest(basePaths.target + 'css/'));
});

/*
 *
 */
gulp.task('copy-assets-webapp-js', [], function () {
    // Own JS Assets
    return gulp.src(basePaths.assets + 'js/webapp.js')
        .pipe(gulp.dest(basePaths.temp + 'js/webapp/'));
});

/*
 *
 */
gulp.task('concat-js', ['copy-assets-webapp-js'], function () {
    return gulp.src([
        basePaths.temp + 'js/jquery/jquery.js',
        basePaths.temp + 'js/popper.js/popper.min.js',
        basePaths.temp + 'js/bootstrap/bootstrap.js',
        basePaths.temp + 'js/bootstrap-multiselect/bootstrap-multiselect.js',
        basePaths.temp + 'js/bootstrap-datepicker/bootstrap-datepicker.js',
        basePaths.temp + 'js/bootstrap-datepicker/bootstrap-datepicker.de.min.js',
        basePaths.temp + 'js/bootstrap-slider/bootstrap-slider.js',
        basePaths.temp + 'js/mapbox-gl/mapbox-gl-dev.js',
        basePaths.temp + 'js/ekko-lightbox/ekko-lightbox.js',
        basePaths.temp + 'js/webapp/webapp.js'
    ])
        .pipe(concat('webapp.min.js'))
        //.pipe(uglify()) // comment out for devel
        .pipe(gulp.dest(basePaths.target + './js/'));
});

/*
 *
 */
gulp.task('copy-assets', function () {

    /********** JS **********/
    // jQuery
    gulp.src(basePaths.packages + 'jquery/dist/*.js')
        .pipe(gulp.dest(basePaths.temp + 'js/jquery'));

    // Popper
    gulp.src(basePaths.packages + 'popper.js/dist/umd/popper.min.js')
        .pipe(gulp.dest(basePaths.temp + 'js/popper.js'));

    // Bootstrap
    gulp.src(basePaths.packages + 'bootstrap/dist/js/bootstrap.js')
        .pipe(gulp.dest(basePaths.temp + 'js/bootstrap'));

    // Bootstrap Multiselect
    gulp.src(basePaths.packages + 'bootstrap-multiselect/dist/js/*.js')
        .pipe(gulp.dest(basePaths.temp + 'js/bootstrap-multiselect'));

    // Bootstrap Datepicker
    gulp.src(basePaths.packages + 'bootstrap-datepicker/dist/js/bootstrap-datepicker.js')
        .pipe(gulp.dest(basePaths.temp + 'js/bootstrap-datepicker'));
    gulp.src(basePaths.packages + 'bootstrap-datepicker/dist/locales/bootstrap-datepicker.de.min.js')
        .pipe(gulp.dest(basePaths.temp + 'js/bootstrap-datepicker'));

    // Bootstrap Slider
    gulp.src(basePaths.packages + 'bootstrap-slider/dist/bootstrap-slider.js')
        .pipe(gulp.dest(basePaths.temp + 'js/bootstrap-slider'));

    // Bootstrap Lightbox
    gulp.src(basePaths.packages + 'ekko-lightbox/dist/ekko-lightbox.js')
        .pipe(gulp.dest(basePaths.temp + 'js/ekko-lightbox'));

    // Mapbox GL
    gulp.src(basePaths.packages + 'mapbox-gl/dist/mapbox-gl-dev.js')
        .pipe(gulp.dest(basePaths.temp + 'js/mapbox-gl'));

    // LiveSearch
    gulp.src(basePaths.assets + 'js/livesearch.js')
        .pipe(gulp.dest(basePaths.temp + 'js/livesearch/'));

    // Own JS Assets
    gulp.src(basePaths.assets + 'js/webapp.js')
        .pipe(gulp.dest(basePaths.temp + 'js/webapp/'));

    /********** SASS **********/

    // Base
    gulp.src(basePaths.assets + 'base/base.scss')
        .pipe(gulp.dest(basePaths.temp + 'sass/'));

    // Normalize
    gulp.src(basePaths.packages + 'normalize.css/normalize.css')
        .pipe(rename('normalize.scss'))
        .pipe(gulp.dest(basePaths.temp + 'sass/normalize.css/'));

    // Bootstrap
    gulp.src(basePaths.packages + 'bootstrap/scss/**/*.scss')
        .pipe(gulp.dest(basePaths.temp + 'sass/bootstrap/'));

    // Bootstrap Multiselect
    gulp.src(basePaths.packages + 'bootstrap-multiselect/dist/css/bootstrap-multiselect.css')
        .pipe(rename('bootstrap-multiselect.scss'))
        .pipe(gulp.dest(basePaths.temp + 'sass/bootstrap-multiselect/'));

    // Bootstrap Slider
    gulp.src(basePaths.packages + 'bootstrap-slider/dist/css/bootstrap-slider.css')
        .pipe(rename('bootstrap-slider.scss'))
        .pipe(gulp.dest(basePaths.temp + 'sass/bootstrap-slider/'));

    // Bootstrap Datepicker
    gulp.src(basePaths.packages + 'bootstrap-datepicker/dist/css/bootstrap-datepicker.css')
        .pipe(rename('bootstrap-datepicker.scss'))
        .pipe(gulp.dest(basePaths.temp + 'sass/bootstrap-datepicker/'));

    // Bootstrap Ekko Lightbox
    gulp.src(basePaths.packages + 'ekko-lightbox/dist/ekko-lightbox.css')
        .pipe(rename('ekko-lightbox.scss'))
        .pipe(gulp.dest(basePaths.temp + 'sass/ekko-lightbox/'));

    // Font Awesome
    gulp.src(basePaths.packages + 'font-awesome/scss/*.scss')
        .pipe(gulp.dest(basePaths.temp + 'sass/font-awesome/'));

    // Mapbox GL
    gulp.src(basePaths.packages + 'mapbox-gl/dist/mapbox-gl.css')
        .pipe(rename('mapbox-gl.scss'))
        .pipe(gulp.dest(basePaths.temp + 'sass/mapbox-gl'));

    // Own CSS Assets
    gulp.src(basePaths.assets + 'sass/**/*.scss')
        .pipe(gulp.dest(basePaths.temp + 'sass/webapp/'));


    /********** Fonts **********/

    // Google Fonts
    gulp.src(basePaths.assets + 'fonts.list')
        .pipe(googleWebFonts({
            fontsDir: basePaths.target + 'fonts/google-fonts/',
            cssDir: basePaths.temp + 'pre-sass/google-fonts/',
            cssFilename: 'google-fonts.scss'
        }))
        .pipe(gulp.dest('./'));

    gulp.src(basePaths.temp + 'pre-sass/google-fonts/google-fonts.scss')
        .pipe(replace('static', '/static'))
        .pipe(gulp.dest(basePaths.temp + 'sass/google-fonts/'));

    // Font Awesome Fonts
    gulp.src(basePaths.packages + 'font-awesome/fonts/**/*.{ttf,woff,woff2,eof,svg}')
        .pipe(gulp.dest(basePaths.target + 'fonts/font-awesome/'));


    /********** Images **********/


    /********** full copy **********/

});
