'use strict';

const path = require('path');

function getRunCmdEnv() {
    const env = {};
    Object.keys(process.env).forEach(key => {
        env[key] = process.env[key];
    });
    // make sure `kit-tools/node_modules/.bin` in the PATH env
    const nodeModulesBinDir = path.join(__dirname, '../../node_modules/.bin');
    env.PATH = env.PATH ? `${nodeModulesBinDir}:${env.PATH}` : nodeModulesBinDir;
    return env;
}

function runCmd(cmd, _args, fn) {
    const args = _args || [];
    const runner = require('child_process').spawn(cmd, args, {
        // keep color
        stdio: 'inherit',
        env: getRunCmdEnv()
    });

    runner.on('close', code => {
        if (fn) {
            fn(code);
        }
    });
}

module.exports = runCmd;
