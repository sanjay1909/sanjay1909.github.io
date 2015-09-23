var gulp = require("gulp");

gulp.task("style", function () {
    var jscs = require("gulp-jscs");

    return gulp.src(["src/scripts/**/*.js", "src/scripts/**/*.jsx", "*.js"])
        .pipe(jscs());
});
