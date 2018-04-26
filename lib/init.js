'use strict';

// from publish-please

const path = require('path');
const writeFile = require('fs').writeFileSync;
const fs = require('fs');
const chalk = require('chalk');
const getNpmArgs = require('./utils/get-npm-args');
const exec = require('child_process').exec;
const tSCommonConfig = require('./getTSCommonConfig')();
const cfs = require('./utils/fs');

const pathJoin = path.join;

function reportNoConfig() {
    console.log(chalk.bgRed('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'));
    console.log(chalk.bgRed("!! Unable to setup kit-tools: project's package.json either missing !!"));
    console.log(chalk.bgRed('!! or malformed. Run `npm init` and then reinstall kit-tools.       !!'));
    console.log(chalk.bgRed('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'));
}

function reportCompletion() {
    console.log(chalk.bgGreen('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'));
    console.log(chalk.bgGreen('!! kit-tools was successfully installed for the project. !!'));
    console.log(chalk.bgGreen('!! Use `npm run pub` command for publishing.       !!'));
    console.log(chalk.bgGreen('!! publishing configuration.                                  !!'));
    console.log(chalk.bgGreen('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'));
}

function addConfigHooks(cfg, projectDir) {
    if (!cfg.scripts) {
        cfg.scripts = {};
    }

    if (cfg.scripts.pub) {
        return false;
    }

    cfg.scripts = Object.assign(cfg.scripts, {
        compile: 'kit-tools run compile',
        tslint: 'tslint -c tslint.json -p tsconfig.json'
    });

    writeFile(pathJoin(projectDir, 'package.json'), JSON.stringify(cfg, null, 2));

    // 复制.vscode setting 文件 到项目目录
    if (!fs.existsSync(`${projectDir}/.vscode/extensions.json`)) {
        exec(`cp ../vscodeSetting/extensions.json ${projectDir}/.vscode/`);
    }
    if (!fs.existsSync(`${projectDir}/.vscode/launch.json`)) {
        exec(`cp ../vscodeSetting/launch.json ${projectDir}/.vscode/`);
    }
    if (!fs.existsSync(`${projectDir}/.vscode/settings.json`)) {
        exec(`cp ../vscodeSetting/settings.json ${projectDir}/.vscode/`);
    }
    if (!fs.existsSync(`${projectDir}/.vscode/tasks.json`)) {
        exec(`cp ../vscodeSetting/tasks.json ${projectDir}/.vscode/`);
    }
    if (!fs.existsSync(`${projectDir}/.vscode/tslint.json`)) {
        exec(`cp ../vscodeSetting/tslint.json ${projectDir}/`);
    }

    cfs.creatFile('./tsconfig.json', JSON.stringify(tSCommonConfig, null, 4), true);

    if (!fs.existsSync(`${projectDir}/jest.config.js`)) {
        exec('cp -R ./jest/* ' + projectDir);
    }
    return true;
}

function init() {
    const testMode = process.argv.indexOf('--test-mode') > -1;

    // NOTE: don't run on dev installation (running `npm install` in this repo)
    if (!testMode) {
        const npmArgs = getNpmArgs();

        if (!npmArgs || !npmArgs.some(arg => /^kit-tools(@\d+\.\d+.\d+)?$/.test(arg))) {
            return;
        }
    }
    // NOTE: <projectDir>/node_modules/kit-tools/lib
    const projectDir = pathJoin(__dirname, '../../../');

    const cfg = require(path.join(projectDir, 'package.json'));

    if (!cfg) {
        reportNoConfig();
        process.exit(1);
    } else if (addConfigHooks(cfg, projectDir)) {
        reportCompletion();
    }
}

init();
