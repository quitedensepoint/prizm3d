/* jshint node: true */

var gulp = require('gulp');
var rename = require('gulp-rename');
var gutil = require('gulp-util');
var shell = require('gulp-run');
var run = require('run-sequence');
var webpack = require('webpack');
var webpackConfig = require('./webpack.config.js');

var cheerio = require('gulp-cheerio');
var svgstore = require('gulp-svgstore');
var svgmin = require('gulp-svgmin');
var svgfallback = require('gulp-svgfallback');
var gulpFilter = require('gulp-filter');

var svgsource = 'viewer-assets/img/svg/*.svg';
var svgdest = 'modules/svg-icons';

var notifier = require('node-notifier');
var ns = require('node-stream');

var argv = require('yargs').argv;

var config = Object.create(webpackConfig);
if (argv.p) {
    config.plugins = config.plugins.concat(
        // these are the modules added by "-p" CLI flag
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin()
    );
    // disable watch, this is single-run only
    config.watch = false;
    // exit with a non-0 error code if the build fails
    config.bail = true;
} else {
    // assume development build settings
    config.watch = false;
    config.devtool = 'sourcemap';
    config.debug = true;
}

var compiler = webpack(config);

// build SVG icons and PNG fallback
gulp.task('svgfallback', function() {
    var filter = gulpFilter('*.png');
    
    return ns.pipeline.obj(
        gulp.src(svgsource),
        rename({ prefix: 'pcc-icon-' }),
		svgmin(),
        cheerio(function($, file) {
            // add a width and height    
            var size = '20px';    
            $('svg').attr('width', size)
                    .attr('height', size)
                    .attr('fill', '#4f575b');
        }),
		svgfallback({ backgroundUrl: '../img/svg-icons.png' }),
        rename({ basename: 'svg-icons' }),
        gulp.dest(svgdest),
        filter,
        gulp.dest('viewer-assets/img')
    );
});
gulp.task('svgstore', ['svgfallback'], function() {
    return ns.pipeline.obj(
	    gulp.src(svgsource),
        rename({ prefix: 'pcc-icon-' }),
		svgmin(),
		svgstore(),
        rename('svg-icons.svg'),
		gulp.dest(svgdest)
    );
});

// enables native system notifications
// use as "gulp -n"
function notify(message) {
    if (!argv.n) { return; }
    
    notifier.notify({
        title: 'e-signer',
        message: message,
        time: 1000
    });
}

// build the webpack modules
gulp.task('webpack', function(callback) {
    compiler.run(function(err, stats) {

        if (config.bail && err) {
            return callback(err);
        }

        var logString = stats.toString({
            colors: true
        });
        
        if (!argv.p) {
            // do some cleanup for dev builds
            logString = logString
                .replace(/\[[0-9]+\][^\n]+(?:\n|$)/g, '')
                .replace(/chunk[^\n]+(?:\n|$)/g, '');
            
            // show system notification
            notify('Webpack complete');
        }
        
        gutil.log('[webpack]', logString);
        
        callback();
    });
});

// build JSDoc documentation
gulp.task('docs', function(callback) {
    return shell('npm run-script docs').exec(callback);
});

var watchDeps = ['build'];
if (argv.docs) { watchDeps.push('docs'); }

// task to watch for changes during dev
gulp.task('watch', watchDeps, function(callback) {
    // watch any module files and build webpack
    var moduleFiles = [
        'modules/**/*.{js,less,html}',
        'modules/svg-icons/**'
    ];
    gulp.watch(moduleFiles, ['webpack']);
    
    if (argv.docs) {
        // watch docs
        gulp.watch('modules/**/*.js', ['docs']);
    }
    
    // watch svg images
    gulp.watch(svgsource, ['svgstore']);
});

// create a production build
gulp.task('build', function(callback) {
    // run these in sequence
    run('svgstore', 'webpack', callback);
});

// just syntax sugar -- alias for the watch task
gulp.task('dev', ['watch']);
gulp.task('default', ['dev']);
