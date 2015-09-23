var gulp = require("gulp");

gulp.task("lint", function () {
    var eslint = require("gulp-eslint");

    return gulp.src(["src/**/*.js", "src/**/*.jsx", "*.js"])
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format());
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failOnError last.
    // .pipe(eslint.failOnError());
});
