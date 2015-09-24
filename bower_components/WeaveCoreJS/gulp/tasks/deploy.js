var gulp = require('gulp');
var ghPages = require('gulp-gh-pages');
var path = require("path");

gulp.task('deploy', function () {
    var config = require("../config.js");
    var con = Object.create(config);
    return gulp.src(path.join(con.context, '/build/**/*'))
        .pipe(ghPages());
});
