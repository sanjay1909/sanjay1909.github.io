var webpack = require("webpack");
var path = require("path");
var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");

module.exports = {
    context: __dirname,
    entry: {
        lib: "./demo/demo.js"
    },
    output: {
        path: path.join(__dirname, "build/"),
        filename: "portfolio-demo.js",
        publicPath: "js/",
        library: "Portfolio-Demo",
        libraryTarget: "umd",
    },
    module: {
        loaders: [
            {
                test: /\.json$/,
                loader: "json"
            },
            {
                test: /\.(js|jsx)$/,
                loaders: ["babel"],
                exclude: /node_modules/
            },
            {
                test: /\.scss$/,
                loaders: ["style", "css", "autoprefixer", "sass?outputStyle=expanded"]
            },
		]
    },
    plugins: [
		new webpack.NoErrorsPlugin(),
		// new CommonsChunkPlugin("vendor", "vendor.bundle.js")
		/*,
		new webpack.ContextReplacementPlugin(/colors$/, /^$/),
		new webpack.IgnorePlugin(/(dtrace-provider)|(source-map-support)$/)*/
	],
    externals: {
        "react": "React",
        "d3": "d3",
        "weavecore": ["weavecore", "WeaveAPI"],
        "Portfolio": "Portfolio"
    },
    resolve: {
        // ReStock: "src/",
        // root: [__dirname, path.join(__dirname, "src"), path.join(__dirname, "docs")],
        extensions: ["", ".js", ".jsx", ".scss", ".md"]
    }
    /*,
    	node: {
    		fs: "empty",
    		"dtrace-provider": "empty",
    		"source-map-support": "empty"
    	}*/
};
