var gulp = require('gulp');
var exec = require('child_process').exec;
var sass = require('gulp-sass');
 
gulp.task('sass', function () {
  gulp.src('./static/sass/*.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('./static/css'));
});
 
gulp.task('sass:watch', function () {
  gulp.watch('./static/sass/*.scss', ['sass']);
});


gulp.task('default', ['sass:watch'], function() {

});