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




    // run webpack
    var webpackConfig = require("../../webpack.config.demo.js");
    var myConfig = Object.create(webpackConfig);



    build(myConfig, cb);
});
