#!/usr/bin/env node

'use strict';

const colors = require('colors');
const gulp = require('gulp');
const program = require('commander');
const getNpmArgs = require('../utils/get-npm-args');

program.on('--help', () => {
    console.log('\n  Usage:kit-tools run compile'.green);
});

program.parse(process.argv);

const task = program.args[0];

if (!task) {
    program.help();
} else {
    console.log('kit-tools run', task);

    require('../gulpfile');

    gulp.start(task);
}
