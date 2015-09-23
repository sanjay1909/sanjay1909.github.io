var gulp = require("gulp"),
    del = require("del");

gulp.task("clean", function (callback) {
    del(["build", ".sass-cache"], callback);
});
