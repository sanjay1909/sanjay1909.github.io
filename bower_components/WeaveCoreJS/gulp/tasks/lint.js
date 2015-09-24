var gulp = require('gulp');
var jshint = require('gulp-jshint');
var config = require('../config').lint;


/*
 * The first task will check any JavaScript code for errors by passing it through the default linting engine.
 * Simply register the task by providing a name and the associating function.
 * Here the source directory is set and all files within it will be piped to the jshint() method for parsing and validation.
 */
gulp.task('lint', function () {
    return gulp.src(config.scriptFiles)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});
