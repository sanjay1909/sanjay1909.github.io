var gulp = require("gulp"),
    gutil = require("gulp-util"),
    webpack = require("webpack");

function build(myConfig, cb) {
    myConfig.plugins = myConfig.plugins.concat(
        new webpack.DefinePlugin({
            "process.env": {
                // This has effect on the react lib size
                NODE_ENV: JSON.stringify("production")
            }
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin()
    );

    var compiler = webpack(myConfig);

    compiler.run(function (err, stats) {
        if (err) throw new gutil.PluginError("webpack:build", err);
        gutil.log("[webpack:build]", stats.toString({
            colors: true
        }));
        cb();
    });
}

gulp.task("demo", ["build"], function (cb) {

    //var replace = require("gulp-replace");
    /*eslint-disable */

    /* gulp.src("./docs/*.html")
      .pipe(replace(/<!-- *custom:jsinclude *([^ ]*) *-->/g,
          '<script type="text/javascript" src="$1"></script>'))
      .pipe(replace(/<!-- *custom:cssinclude *([^ ]*) *-->/g,
          '<link href="$1" rel="stylesheet">'))
      .pipe(replace(/<!-- *custom:remove(.|\n)*?endcustom -->/g,
          ""))
      .pipe(gulp.dest("./build"));*/
    /*eslint-enable */

    // run webpack
    var webpackConfig = require("../../webpack.config.demo.js");
    var myConfig = Object.create(webpackConfig);

    gulp.src(["./demo/images/*"])
        .pipe(gulp.dest("build/images"));

    gulp.src(["./demo/data/*"])
        .pipe(gulp.dest("build/data"));
    gulp.src(["./bower_components/**/build/dist/*.js", "./bower_components/**/build/dist/*.js.map"])
        .pipe(gulp.dest("build/libs"));

    build(myConfig, cb);
});
