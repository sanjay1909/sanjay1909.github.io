var gulp = require('gulp');
var concat = require('gulp-concat');
var config = require('../config').concat;

/*
 * To streamline network resources
 * let’s also make sure any JavaScript files are combined into one file and
 * then a minified version of each created.
 * Once more, set the source directory from which to pull the files,
 * which are then concatenated and injected with a header value before being placed into the destination directory.
 */

gulp.task('concat', function () {
    return gulp.src(config.scriptFiles)
        .pipe(concat(config.combined))
        .pipe(gulp.dest(config.dest));
});
