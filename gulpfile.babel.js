import gulp from 'gulp';
import del from 'del';
import connect from 'gulp-connect';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import stream from 'webpack-stream';
import envify from 'envify';
import gutil from 'gulp-util';
import merge from 'merge-stream';
import rename from 'gulp-rename';
import webpack from 'webpack';
import git from 'gulp-git';
import replace from 'gulp-replace';

import webpackConfig from './webpack.config.js';

process.env.NODE_ENV = 'production';

let firstBuild = 0;
let commitHash = '';

gulp.task('clean', () => {
	return del(['./public/**/*','./cache/**/*', './src/js/bakedConfig.js']);
});

gulp.task('copy', ['clean'], () => {

	if (process.env.NODE_ENV == 'development') {
		// watch the files for changes
		gulp.watch('./src/assets/**/*')
			.on('change', () => {
				return gulp.src('./src/assets/**/*')
					.pipe(gulp.dest('./public/assets'));
			});
	}

	return merge(
		gulp.src('./config.js')
			.pipe(rename('bakedConfig.js'))
			.pipe(gulp.dest('./src/js')),
		gulp.src('./src/index.html')
			.pipe(gulp.dest('./public')),
		gulp.src('./src/fonts/**/*')
			.pipe(gulp.dest('./public/fonts')),
		gulp.src('./src/assets/**/*')
			.pipe(gulp.dest('./public/assets'))
	);
});

gulp.task('sass', ['copy'], () => {
	if (process.env.NODE_ENV == 'development') {
		gulp.watch(['./src/sass/*.scss'])
			.on('change', () => {
				return gulp.src('./src/sass/*.scss')
					.pipe(sass.sync().on('error', sass.logError))
					.pipe(gulp.dest('./public/css'))
					.pipe(connect.reload())
					.on('end', () => {
						gutil.log('CSS done');
					});
			});
	}
	return gulp.src('./src/sass/**/*.scss')
		.pipe(sass.sync().on('error', sass.logError))
		.pipe(gulp.dest('./public/css'));
});

gulp.task('build', ['sass'], (callback) => {

	if (process.env.NODE_ENV == 'development') {
		gulp.watch('./src/js/**/*')
			.on('change', () => {
				return gulp.src('./src/js/**/*')
					.pipe(sourcemaps.init())
					.pipe(stream(webpackConfig))
					.pipe(sourcemaps.write())
					.pipe(gulp.dest('./public/js'))
					.pipe(connect.reload());
			});
	}
	else if (process.env.NODE_ENV == 'production') {
		webpackConfig.plugins = [];

		// use prod versions of things
		webpackConfig.plugins.push(
			new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
            }));

		// remove duplicated stuff
		webpackConfig.plugins.push(
			 new webpack.optimize.DedupePlugin()
		);

		// minify
		webpackConfig.plugins.push(
			new webpack.optimize.UglifyJsPlugin({
	            compress: true,
	            warnings: false,
	            sourceMap: false
	        })
		);
	}

	return gulp.src('./src/js/**/*')
		.pipe(sourcemaps.init())
		.pipe(stream(webpackConfig))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./public/js'))
		.pipe(connect.reload());
});

gulp.task('serve', ['build'], () => {
	return connect.server({
		port: 5000,
		root: './public',
		livereload: true
	});
});

gulp.task('fetchHash', ['build'], (done) => {
	git.revParse({args: '--short HEAD', quiet: true}, (err, hash) => {
		commitHash = hash;
		done();
	});
});

gulp.task('rename', ['fetchHash'], () => {
	// rename app.js to prevent caching
	merge(
		gulp.src('./public/index.html')
			.pipe(replace('js/app.js', 'js/app.' + commitHash + '.js'))
			.pipe(replace('css/style.css', 'css/style.' + commitHash + '.css'))
			.pipe(gulp.dest('./public')),
		gulp.src('./public/js/app.js')
			.pipe(rename('app.' + commitHash + '.js'))
			.pipe(gulp.dest('./public/js')),
		gulp.src('./public/css/style.css')
			.pipe(rename('style.' + commitHash + '.css'))
			.pipe(gulp.dest('./public/css'))
	);
});

gulp.task('cleanProd', ['rename'], () => {
	// remove the old app.js and style.css files
	return del(['./public/css/style.css', './public/js/app.js']);
});

gulp.task('setDev', () => {
	process.env.NODE_ENV = 'development';
});

gulp.task('setProd', () => {
	process.env.NODE_ENV = 'production';
});

gulp.task('prod', ['setProd', 'cleanProd']);

gulp.task('default', ['setDev', 'serve']);