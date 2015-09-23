var gulp = require("gulp");

gulp.task("lint-watch", function () {
    gulp.watch(["src/**/*.js", "src/**/*.jsx", "*.js", ".eslintrc"], ["lint"]);
});
