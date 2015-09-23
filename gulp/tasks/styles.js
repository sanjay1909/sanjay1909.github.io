var gulp = require("gulp");

gulp.task("styles", function () {
    var sass = require("gulp-sass"),
        autoprefixer = require("gulp-autoprefixer"),
        concatCss = require("gulp-concat-css");

    var webpackConfig = require("../../webpack.config.js");
    return gulp.src("src/styles/*.scss")
        .pipe(sass({
            style: 'expanded'
        }).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ["last 6 versions"],
            cascade: false
        }))
        .pipe(concatCss("sanjay.css"))
        .pipe(gulp.dest("build/styles"));
});
