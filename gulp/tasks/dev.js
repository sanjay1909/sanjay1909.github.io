var gulp = require("gulp"),
    gutil = require("gulp-util"),
    webpack = require("webpack");

gulp.task("dev", function (callback) {
    console.log('dev called');
    var webpackConfig = require("../../webpack.config.dev.js");
    var myDevConfig = Object.create(webpackConfig);


    // create a single instance of the compiler to allow caching
    var devCompiler = webpack(myDevConfig);

    // run webpack
    devCompiler.run(function (err, stats) {
        if (err) throw new gutil.PluginError("webpack:build-dev", err);
        gutil.log("[webpack:build-dev]", stats.toString({
            colors: true
        }));
        callback();
    });
});
