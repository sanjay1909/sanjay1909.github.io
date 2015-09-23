var gulp = require("gulp"),
    gutil = require("gulp-util");

gulp.task("default", function () {
    gutil.log("Usage gulp [", gutil.colors.magenta("task"), "]");
    gutil.log("List of available ", gutil.colors.magenta("tasks"));
    gutil.log(gutil.colors.magenta("clean"), "   clean the ./build directory");
    gutil.log(gutil.colors.magenta("build"), "   create a production build with minified assets");
    gutil.log(gutil.colors.magenta("dev"), "     create a dev build with assets and sourcemap");
    gutil.log(gutil.colors.magenta("watch"), "   build and watch the changes. Hot reload styles and javascript");
    gutil.log("          Launches a browser at localhost:3500 and does a hot reload");
    gutil.log("          on change of *.scss under src/styles/");
    gutil.log("          on change of *.js[x]? under src/scripts/subfolder");
    gutil.log(gutil.colors.magenta("serve"), "   serve a webserver on localhost:3500");
    gutil.log(gutil.colors.magenta("release"), " create files under build/cjs that can be published to npm");

});
