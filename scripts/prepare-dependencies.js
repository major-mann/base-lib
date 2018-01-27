/**
 * @module DependencyPreparation Installs the dev dependencies required for environment preparation.
 * TODO: Change this module so that it works without a destination package json (Including cleaning up any
 *  modules installed by the process)
 */

// Node modules
const childProcess = require('child_process'),
    path = require('path');

// Local packages
const sourcePackage = require('../package.json'),
    sys = require('./util/sys.js');

// Globals
const spawn = childProcess.spawn;

module.exports = async function doDependencyChecks() {
    await exec();
};

function exec() {
    return sys.consumerPath()
        .then(prepNpmInstall)
        .catch(function onError(err) {
            console.error(`An error occured while preparing the dependencies ${err.stack}`);
            throw err;
        });
}

async function prepNpmInstall(appRoot) {
    let destPackage, flag;
    const destPackagePath = path.join(appRoot, 'package.json');
    const txt = await sys.read(destPackagePath);
    try {
        destPackage = JSON.parse(txt);
    } catch (ex) {
        throw new Error(`Unable to parse destination package.json! ${ex.message}`);
    }

    if (sourcePackage.devDependencies) {
        destPackage.devDependencies = destPackage.devDependencies || {};
        Object.keys(sourcePackage.devDependencies).forEach(copyDependency);
        if (flag) {
            const writeTxt = JSON.stringify(destPackage, null, 4);
            await sys.write(destPackagePath, writeTxt);
            await npmInstall(appRoot);
        }
    }

    function copyDependency(name) {
        if (!destPackage.devDependencies[name] && sourcePackage.devDependencies[name] === 'latest') {
            flag = true;
            destPackage.devDependencies[name] = sourcePackage.devDependencies[name];
        }
    }
}

function npmInstall(appRoot) {
    return new Promise(function promiseHandler(resolve, reject) {
        const args = ['install'];
        console.info(`Running "npm ${args.join(' ')}" (In "${appRoot}"):`);
        const npm = spawn('npm', args, {
            cwd: appRoot,
            stdio: ['ignore', 'pipe', 'pipe']
        });
        const output = [];
        const errOutput = [];
        npm.stderr.on('data', function onErrorChunk(data) {
            process.stderr.write(data);
            data = data.toString('utf8');
            errOutput.push(data);
        });
        npm.stdout.on('data', function onDataChunk(data) {
            process.stdout.write(data);
            data = data.toString('utf8');
            output.push(data);
        });
        npm.on('close', function onClose(code) {
            if (code) {
                reject(new Error(`NPM install existed with code ${code} while running install. ${errOutput.join('')}`));
            } else {
                resolve(output.join(''));
            }
        });
    });
}
