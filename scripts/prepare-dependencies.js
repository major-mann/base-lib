const spawn = require('child_process').spawn,
    sys = require('./util/sys.js'),
    sourcePackage = require('../package.json');

module.exports = function doDependencyChecks() {
    if (checkDependencies()) {
        // Everything is already here!
        return Promise.resolve();
    } else {
        return exec();
    }
};

function checkDependencies() {
    return Object.keys(sourcePackage.devDependencies).every(checkDep);

    /** Checks an individual dependency */
    function checkDep(name) {
        try {
            require(name);
            return true;
        } catch (ex) {
            console.info(`Dependency was not found "${name}"`);
            return false;
        }
    }
}

function exec() {
    return sys.consumerPath()
        .then(prepNpmInstall)
        .catch(function onError(err) {
            console.error(`An error occured while preparing the dependencies ${err.stack}`);
            throw err;
        });
}

function prepNpmInstall(appRoot) {
    const packages = Object.keys(sourcePackage.devDependencies)
        .map(p => `${p}@${sourcePackage.devDependencies[p]}`);
    return npmInstall(appRoot, packages);
}

function npmInstall(appRoot, packages) {
    return new Promise(function promiseHandler(resolve, reject) {
        const args = ['install', '--save-dev', ...packages];
        console.info(`Running "npm ${args.join(' ')}" (In "${appRoot}"):`);
        const npm = spawn('npm', ['install', '--save-dev', ...packages], {
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
