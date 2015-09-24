var gulp = require('gulp');

gulp.task('default', ['lint', 'concat', 'yuidoc']);

gulp.task('build', ['lint', 'concat', 'yuidoc']);

/*gulp.task('default', ['iconFont'], function () {
    //gulp.start('sass', 'images', 'markup', 'watch');
    gulp.start('browserify');
});*/
