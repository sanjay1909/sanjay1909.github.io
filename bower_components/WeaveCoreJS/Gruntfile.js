module.exports = function (grunt) {

    // 1. All configuration goes here
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            // 2. Configuration for concatinating files goes here.
            dist: {
                src: [
                    'src/createjs/events/*.js', // All JS in the libs folder
                    'src/createjs/Ticker.js',
                    'src/compiler/*.js', // This specific file
                    'src/core/DynamicState.js',
                    'src/core/ILinkableObject.js',
                    'src/core/CallbackCollection.js',
                    'src/core/SessionManager.js',
                    'src/primitive/WeaveTreeItem.js',
                    'src/primitive/Dictionary2D.js',

                    'src/core/LinkableVariable.js',
                    'src/core/LinkableNumber.js',
                    'src/core/LinkableBoolean.js',
                    'src/core/LinkableString.js',
                    'src/core/ChildListCallbackInterface.js',
                    'src/core/LinkableWatcher.js',
                    'src/core/LinkableHashMap.js',
                    'src/core/LinkablePromise.js',

                    'src/data/keysetCallbackInterface',

                    'src/WeaveAPI.js',

                    'src/core/LinkableDynamicObject.js',
                    'src/core/StageUtils.js',
                    'src/core/ExternalSessionStateInterface',
                    'src/core/SessionStateLog.js',
               ],
                dest: 'weavecore.js',
            }
        },
        uglify: {
            build: {
                src: 'weavecore.js',
                dest: 'weavecore.min.js'
            }
        }

    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-contrib-concat'); // to combine all files to a single file
    grunt.loadNpmTasks('grunt-contrib-uglify'); // to minify the combined file

    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    grunt.registerTask('default', ['concat', 'uglify']);

};
