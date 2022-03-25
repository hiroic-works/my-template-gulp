// moduleの読み込み
const gulp = require('gulp');
const browserSync = require('browser-sync');
const plumber = require('gulp-plumber');
const autoPrefixer = require('gulp-autoprefixer');
const cmq = require('gulp-merge-media-queries');
const sass = require('gulp-dart-sass');
const cssmin = require('gulp-clean-css');
const del = require('del');
const mozjpeg = require("imagemin-mozjpeg");
const pngquant = require("imagemin-pngquant");
const svgo = require('imagemin-svgo');
const gifsicle = require('imagemin-gifsicle');
const changed = require("gulp-changed");
const imagemin = require("gulp-imagemin");
const webpack = require('webpack');
const webpackStream = require("webpack-stream");
const notifier = require('node-notifier');
const ejs = require('gulp-ejs');
const fs = require('fs');
const path = require('path');
const beautify = require('gulp-beautify');
const rename = require('gulp-rename');
const gdata = require('gulp-data');

// webpack設定
const webpackDevConfig = require("./webpack.dev");
const webpackProdConfig = require("./webpack.prod");


// 共通ディレクトリパス
const BASIC_PATH = {
	ASSETS: 'src/assets',
	VIEWS: 'src/views',
	PUBLIC: 'dist'
}

// 各pageデータ
const PAGES_DATA = JSON.parse(fs.readFileSync('pages.json'));

const SETTINGS = {
	// srcファイルglobs
	SRC_LIST: {
		SCSS: [
			`${BASIC_PATH.ASSETS}/scss/**/*.scss`
		],
		JS: [
			`${BASIC_PATH.ASSETS}/js/**/*.js`
		],
		IMG: [
			`${BASIC_PATH.ASSETS}/images/**/*`
		],
		EJS: [
			`${BASIC_PATH.VIEWS}/**/*.ejs`,
			`!${BASIC_PATH.VIEWS}/**/_*.ejs`,
		],
	},

	// watchファイルglobs
	WATCH_LIST: {
		SCSS: [
			`${BASIC_PATH.ASSETS}/scss/**/*.scss`,
		],
		JS: [
			`${BASIC_PATH.ASSETS}/js/**/*.js`,
		],
		IMG: [
			`${BASIC_PATH.ASSETS}/images/**/*`,
		],
		EJS: [
			`${BASIC_PATH.VIEWS}/**/*.ejs`,
		]
	},

	//scssのコンパイルオプション
	SCSS_OPTIONS: {
		outputStyle: 'expanded',
		indentType: 'tab',
		indentWidth: 1,
		includePaths: [
			`${BASIC_PATH.ASSETS}/scss/settings`,
			`${BASIC_PATH.ASSETS}/scss/partials`,
		]
	},

	PLUMBER_OPTIONS: {
		errorHandler: (e) => {
			notifier.notify({
				title: '実行エラー',
				message: e.message
			});
			console.log(e.message);
		}
	},

	// JavaScript整形
	BEAUTIFY_OPTIONS: {
		indent_with_tabs: true,
		preserve_newlines: false,
		eol: "\n",
		end_with_newline: true,
	},

	// EJS全体設定
	EJS_DATA: {
		site: {
			common: {
				fullpath: {
					views: path.resolve(__dirname, BASIC_PATH.VIEWS),
					assets: path.resolve(__dirname, BASIC_PATH.ASSETS),
					public: path.resolve(__dirname, BASIC_PATH.PUBLIC)
				},
				isDevelopment: isDevelopment(),
				hash: asset_cache()
			},
		}
	}

}

/**********************************************************************
console test用
*********************************************************************/
const test = (cb) => {
	const sample = JSON.parse(fs.readFileSync('pages.json'));
	const merge = {
		site: {
			...SETTINGS.EJS_DATA.site,
			...sample
		}
	}
	console.log(merge);
	cb()
};
exports.test = test;

/**********************************************************************
initialize task
*********************************************************************/
//scss task
const scssTask = () => {
	return gulp.src(SETTINGS.SRC_LIST.SCSS, { sourcemaps: isDevelopment() })
		.pipe(plumber(SETTINGS.PLUMBER_OPTIONS))
		.pipe(sass(SETTINGS.SCSS_OPTIONS).on('error', sass.logError))
		.pipe(autoPrefixer())
		.pipe(cmq())
		.pipe(gulp.dest(`${BASIC_PATH.PUBLIC}/css`, { sourcemaps: './' }))
		.pipe(browserSync.stream());
};

//js task
const jsTask = () => {
	const webpackConfig = (isDevelopment()) ? webpackDevConfig : webpackProdConfig;
	return gulp.src(SETTINGS.SRC_LIST.JS)
		.pipe(plumber(SETTINGS.PLUMBER_OPTIONS))
		.pipe(webpackStream(webpackConfig, webpack))
		.pipe(gulp.dest(`${BASIC_PATH.PUBLIC}/js`))
		.pipe(browserSync.stream());
};

//img task
const imgTask = () => {
	return gulp.src(SETTINGS.SRC_LIST.IMG)
		.pipe(plumber(SETTINGS.PLUMBER_OPTIONS))
		.pipe(gulp.dest(`${BASIC_PATH.PUBLIC}/images`));
};

//ejs task
const ejsTask = () => {
	const ejsData = {
		site: {
			...SETTINGS.EJS_DATA.site,
			...PAGES_DATA
		}
	}
	return gulp.src(SETTINGS.SRC_LIST.EJS)
		.pipe(plumber(SETTINGS.PLUMBER_OPTIONS))
		.pipe(
			gdata(file => {
				const split = file.path.split(path.resolve(__dirname, BASIC_PATH.VIEWS));
				const ABSOLUTE_PATH = `${split[split.length - 1].replace(/\\/g, '/').replace('.ejs', '.html').replace(/index\.html$/, '')}`;
				const RELATIVE_PATH = '../'.repeat([ABSOLUTE_PATH.split('/').length - 2]);
				return {
					ABSOLUTE_PATH,
					RELATIVE_PATH,
				};
			}),
		)
		.pipe(ejs(ejsData))
		.pipe(rename({ extname: '.html' }))
		.pipe(beautify.html(SETTINGS.BEAUTIFY_OPTIONS))
		.pipe(gulp.dest(BASIC_PATH.PUBLIC))
		.pipe(browserSync.stream());
};


const initializeTasks = gulp.parallel(scssTask, jsTask, imgTask, ejsTask);


/**********************************************************************
delete task
*********************************************************************/
const clean = (cb) => {
	del.sync(`${BASIC_PATH.PUBLIC}/**/*`);
	cb();
};

const afterClean = (cb) => {
	del.sync(`${BASIC_PATH.PUBLIC}/**/*.map`);
	cb();
};

/**********************************************************************
minify task
*********************************************************************/

// CSSの圧縮
const cssminTask = () => {
	return gulp.src(`${BASIC_PATH.PUBLIC}/css/**/*.css`)
		.pipe(plumber(SETTINGS.PLUMBER_OPTIONS))
		.pipe(cssmin())
		.pipe(gulp.dest(`${BASIC_PATH.PUBLIC}/css`));
}
// 画像の圧縮
const imgminTask = () => {
	return gulp.src(`${BASIC_PATH.PUBLIC}/images/**/*`)
		.pipe(plumber(SETTINGS.PLUMBER_OPTIONS))
		.pipe(changed(`${BASIC_PATH.PUBLIC}/images`))
		.pipe(
			imagemin([
				pngquant({
					quality: "70-85",
					speed: 1
				}),
				mozjpeg({
					quality: 85,
					progressive: true
				}),
				svgo({
					removeViewBox: false
				}),
				gifsicle({
					optimizationLevel: 1
				}),
			])
		)
		.pipe(gulp.dest(`${BASIC_PATH.PUBLIC}/images`));
}

// minify task
const minifyTasks = gulp.parallel(cssminTask, imgminTask);


/**********************************************************************
watch task
*********************************************************************/
const watchTask = (cb) => {
	browserSync({
		server: {
			baseDir: BASIC_PATH.PUBLIC
		},
		open: 'external',
	});

	gulp.watch(SETTINGS.WATCH_LIST.SCSS, scssTask);
	gulp.watch(SETTINGS.WATCH_LIST.JS, jsTask);
	gulp.watch(SETTINGS.WATCH_LIST.IMG, imgTask);
	gulp.watch(SETTINGS.WATCH_LIST.EJS, ejsTask);
	cb();
}


/**********************************************************************
exports
*********************************************************************/
exports.default = gulp.series(clean, initializeTasks, watchTask);
exports.build = gulp.series(clean, initializeTasks, minifyTasks, afterClean);

/*********************************************************************

function

*********************************************************************/
function isDevelopment() {
	if (process.env.NODE_ENV == "development") {
		return true
	}
	return false
}

function asset_cache(q = '?') {
	let hash = "";
	if (!isDevelopment()) {
		hash = `${q}cache=${new Date().getTime().toString()}`;
	}
	return hash;
}
