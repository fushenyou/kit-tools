'use strict';

const fs = require('fs');
const path = require('path');
const merge = require('merge');

module.exports = function() {
    let my = {};
    if (fs.existsSync(path.join(process.cwd(), 'tsconfig.json'))) {
        my = require(path.join(process.cwd(), 'tsconfig.json'));
    }
    const defaultConfig = {
        compilerOptions: {
            noUnusedParameters: true,
            noUnusedLocals: true,
            strictNullChecks: true,
            target: 'es6',
            jsx: 'react', //preserve
            moduleResolution: 'node',
            declaration: true,
            allowSyntheticDefaultImports: true,
            outDir: '.debug'
        },
        include: ['components/**/*'],
        exclude: ['node_modules', 'lib', 'es', '**/*.test.ts']
    };
    return merge(defaultConfig, my);
};
