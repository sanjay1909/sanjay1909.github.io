var gulp = require('gulp');
var yuidoc = require('gulp-yuidoc');
var config = require('../config').yuidoc;

// Define a YUIDoc task to generate a separate static web site derived from specially formatted
// comments placed in our JavaScript files, allowing new developers to get up to speed with the
// structure of the project code without needing to comb through each line of code
gulp.task("yuidoc", function () {
    "use strict";
    // Load the JavaScript files from the "src/scripts/" folder and run these through YUIDoc,
    // passing in the name and version number of the project from the package.json file to
    // include in the resulting static documentation web site
    return gulp.src(config.scriptFiles)
        .pipe(yuidoc({
            project: {
                "name": config.name,
                "version": config.version
            }
        }))
        // Place the resulting static web site files in the "dist/docs/" output folder
        .pipe(gulp.dest(config.docsFolder));
});
