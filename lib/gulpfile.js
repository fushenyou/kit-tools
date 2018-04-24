'use strict';

const runCmd = require('./runCmd');
const getBabelCommonConfig = require('./getBabelCommonConfig');
const merge2 = require('merge2');
const { execSync } = require('child_process');
const through2 = require('through2');
const transformLess = require('./transformLess');
const babel = require('gulp-babel');
const argv = require('minimist')(process.argv.slice(2));

const chalk = require('chalk');
const path = require('path');
const watch = require('gulp-watch');
const ts = require('gulp-typescript');
const tsConfig = require('./getTSCommonConfig')();
const gulp = require('gulp');
const fs = require('fs');
const rimraf = require('rimraf');
const replaceLib = require('./replaceLib');
const stripCode = require('gulp-strip-code');

const tsDefaultReporter = ts.reporter.defaultReporter();
const cwd = process.cwd();
const libDir = path.join(cwd, 'lib');
const esDir = path.join(cwd, 'es');

const tsFiles = ['**/*.ts', '**/*.tsx', '!node_modules/**/*.*', 'typings/**/*.d.ts'];

function compileTs(stream) {
    return stream
        .pipe(ts(tsConfig))
        .js.pipe(
            through2.obj(function(file, encoding, next) {
                // console.log(file.path, file.base);
                file.path = file.path.replace(/\.[jt]sx$/, '.js');
                this.push(file);
                next();
            })
        )
        .pipe(gulp.dest(process.cwd()));
}

function babelify(js, modules) {
    const babelConfig = getBabelCommonConfig(modules);
    delete babelConfig.cacheDirectory;
    if (modules === false) {
        babelConfig.plugins.push(replaceLib);
    } else {
        babelConfig.plugins.push(require.resolve('babel-plugin-add-module-exports'));
    }
    let stream = js.pipe(babel(babelConfig)).pipe(
        through2.obj(function z(file, encoding, next) {
            this.push(file.clone());
            if (file.path.match(/\/style\/index\.js/)) {
                const content = file.contents.toString(encoding);
                if (content.indexOf("'react-native'") !== -1) {
                    // actually in antd-mobile@2.0, this case will never run,
                    // since we both split style/index.mative.js style/index.js
                    // but let us keep this check at here
                    // in case some of our developer made a file name mistake ==
                    next();
                    return;
                }
                file.contents = Buffer.from(
                    content.replace(/\/style\/?'/g, "/style/css'").replace(/\.less/g, '.css')
                );
                file.path = file.path.replace(/index\.js/, 'css.js');
                this.push(file);
                next();
            } else {
                next();
            }
        })
    );
    if (modules === false) {
        stream = stream.pipe(
            stripCode({
                start_comment: '@remove-on-es-build-begin',
                end_comment: '@remove-on-es-build-end'
            })
        );
    }
    return stream.pipe(gulp.dest(modules === false ? esDir : libDir));
}

function compile(modules) {
    rimraf.sync(modules !== false ? libDir : esDir);
    const less = gulp
        .src(['src/**/*.less'])
        .pipe(
            through2.obj(function(file, encoding, next) {
                this.push(file.clone());
                if (
                    file.path.match(/\/style\/index\.less$/) ||
                    file.path.match(/\/style\/v2-compatible-reset\.less$/)
                ) {
                    transformLess(file.path)
                        .then(css => {
                            file.contents = Buffer.from(css);
                            file.path = file.path.replace(/\.less$/, '.css');
                            this.push(file);
                            next();
                        })
                        .catch(e => {
                            console.error(e);
                        });
                } else {
                    next();
                }
            })
        )
        .pipe(gulp.dest(modules === false ? esDir : libDir));
    const assets = gulp
        .src(['src/**/*.@(png|svg)'])
        .pipe(gulp.dest(modules === false ? esDir : libDir));
    let error = 0;
    const source = ['src/**/*.tsx', 'src/**/*.ts', 'typings/**/*.d.ts'];
    // allow jsx file in src/xxx/
    if (tsConfig.allowJs) {
        source.unshift('src/**/*.jsx');
    }
    const tsResult = gulp.src(source).pipe(
        ts(tsConfig, {
            error(e) {
                tsDefaultReporter.error(e);
                error = 1;
            },
            finish: tsDefaultReporter.finish
        })
    );

    function check() {
        if (error && !argv['ignore-error']) {
            process.exit(1);
        }
    }

    tsResult.on('finish', check);
    tsResult.on('end', check);
    const tsFilesStream = babelify(tsResult.js, modules);
    const tsd = tsResult.dts.pipe(gulp.dest(modules === false ? esDir : libDir));
    return merge2([less, tsFilesStream, tsd, assets]);
}

gulp.task('compile', ['compile-with-es'], () => {
    compile();
});
gulp.task('compile-with-es', () => {
    compile(false);
});

gulp.task('watch-tsc', ['tsc'], () => {
    watch(tsFiles, f => {
        if (f.event === 'unlink') {
            const fileToDelete = f.path.replace(/\.tsx?$/, '.js');
            if (fs.existsSync(fileToDelete)) {
                fs.unlinkSync(fileToDelete);
            }
            return;
        }
        const myPath = path.relative(cwd, f.path);
        compileTs(
            gulp.src([myPath, 'typings/**/*.d.ts'], {
                base: cwd
            })
        );
    });
});

gulp.task('tsc', () => {
    return compileTs(
        gulp.src(tsFiles, {
            base: cwd
        })
    );
});

function reportError() {
    console.log(chalk.bgRed('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'));
    console.log(chalk.bgRed('!! `npm publish` is forbidden for this package. !!'));
    console.log(chalk.bgRed('!! Use `npm run pub` instead.        !!'));
    console.log(chalk.bgRed('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'));
}
