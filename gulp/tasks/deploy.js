var gulp = require('gulp');
var ghPages = require('gulp-gh-pages');
var path = require("path");

gulp.task('deploy', function () {
    var webpackConfig = require("../../webpack.config.js");
    var config = Object.create(webpackConfig);
    return gulp.src(path.join(config.context, '/build/**/*'))
        .pipe(ghPages());
});
