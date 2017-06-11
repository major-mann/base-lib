#!/usr/bin/env node

/**
 * @module Version bump script. This script bumps the local package.json version and tags the local
 *  git repo (if it exists and git is installed).
 * The script accepts the following arguments
 *      -v --verbose Log information about the process to the console
 *      --major Will update the major version, setting minor and revision to 0
 *      --minor Will update the minor version, setting revision to 0
 *      --revision The default, will increment the revision.
 * @returns 0 If the version bum was succesfull, else -1
 */

// Constants
const PACKAGE = 'package.json',
    GIT_DIRECTORY = '.git',
    GIT = 'git',
    VERSION_COUNT = 3,
    MAJOR = 'major',
    MINOR = 'minor',
    REVISION = 'revision';

// Dependencies
const commandExists = require('command-exists'),
    appRoot = require('app-root-path'),
    minimist = require('minimist'),
    spawn = require('child_process').spawn,
    fs = require('fs');

// Do the bump
bumpPackage();

// TODO: Add change log build

/**
 * Increments the package.json version number, tags the current commit and commits the
 */
function bumpPackage() {
    var version, pkg;
    const argv = minimist(process.argv.slice(2));

    // Determine which part of the version we are updating.
    var update = REVISION;
    if (argv.minor) {
        update = MINOR;
    } else if (argv.major) {
        update = MAJOR;
    }

    loadPackage()
        .then(() => getVersion())
        .then(v => version = v)
        .then(gitExec(() => ensureNoUnstaged()))
        .then(() => increment(update))
        .then(updatePackage)
        .then(gitExec(() => commitPackage()))
        .then(gitExec(() => tag()))
        .then(onComplete)
        .catch(onError);

    function onComplete() {
        console.log(`\x1b[32mVersion bump to ${version.join('.')} completed\x1b[0m`);
    }

    function onError(err) {
        if (err) {
            logError(`Error bumping version! ${err.stack || err}`);
        }
        process.exit(-1);
    }

    function loadPackage() {
        logInfo('load package.json');
        return new Promise(function promiseHandler(resolve, reject) {
            fs.readFile(appRoot.resolve(PACKAGE), { encoding: 'utf8' }, function onFileRead(err, data) {
                if (err) {
                    reject(err);
                } else {
                    pkg = JSON.parse(data);
                    resolve();
                }
            });
        });
    }

    function updatePackage() {
        logInfo('save package.json');
        pkg.version = version.join('.');
        const str = JSON.stringify(pkg, undefined, 2);
        return new Promise(function promiseHandler(resolve, reject) {
            fs.writeFile(appRoot.resolve(PACKAGE), str, { encoding: 'utf8' }, function onFileWritten(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    function getVersion() {
        var version = pkg.version;
        if (version) {
            version = version.split('.')
                .map(v => parseInt(v, 10))
                .map(v => isNaN(v) ? 0 : v);
            while (version.length > VERSION_COUNT) {
                version.pop();
            }
            while (version.length < VERSION_COUNT) {
                version.push(0);
            }
            return version;
        } else {
            return [0, 0, 0];
        }
    }

    function increment(update) {
        logInfo('increment version');
        switch (update) {
            case MAJOR:
                version[0]++;
                version[1] = 0;
                version[2] = 0;
                break;
            case MINOR:
                version[1]++;
                version[2] = 0;
                break;
            case REVISION:
            default:
                version[2]++;
                break;
        }

    }

    function ensureNoUnstaged() {
        logInfo('have unstaged?');
        return new Promise(function promiseHandler(resolve, reject) {
            const git = spawn('git', ['diff', '--exit-code'], { cwd: String(appRoot) });
            git.on('close', function onGitDiffComplete(code) {
                // The --exit-code parameter should make us get a non-zero code for any changes
                const res = code !== 0;
                logInfo(res);
                if (res) {
                    reject(new Error('Cannot bump version with unstaged files!'));
                } else {
                    resolve();
                }
            });
        });
    }

    /** Executes the handler if git exists */
    function gitExec(handler) {
        return function gitExecHandler() {
            return new Promise(function promiseHandler(resolve, reject) {
                commandExists(GIT, function onCheckedForCommand(err, exists) {
                    if (err) {
                        reject(err);
                    } else if (exists) {
                        const path = appRoot.resolve(GIT_DIRECTORY);
                        fs.access(path, fs.constants.R_OK, function onAccessChecked(err) {
                            if (!err) {
                                try {
                                    const res = handler();
                                    if (res instanceof Promise) {
                                        res.then(resolve).catch(reject);
                                    } else {
                                        resolve(res);
                                    }
                                } catch (ex) {
                                    reject(ex);
                                }
                            }
                        });
                    } else {
                        resolve();
                    }
                });
            });
        };
    }

    function tag() {
        const tagName = `v${version.join('.')}`;
        logInfo(`tag with ${tagName}`);
        return execCommand('git', ['tag', tagName]);
    }

    function commitPackage() {
        return stagePackage()
            .then(commitPackage);

        function stagePackage() {
            logInfo('Staging package.json');
            return execCommand('git', ['add', 'package.json'], { cwd: String(appRoot) });
        }

        function commitPackage() {
            logInfo('Committing package.json changes');
            return execCommand('git', ['commit', '-m', './scripts/bump.js committing package.json version update'],
                { cwd: String(appRoot) });
        }
    }

    /** A command execute wrapper making it easier to deal with */
    function execCommand(command, args) {
        return new Promise(function promiseHandler(resolve, reject) {
            const comm = spawn(command, args),
                err = [];
            comm.on('close', onCommandComplete);
            comm.stderr.on('data', onStdErr);

            function onCommandComplete(code) {
                if (code === 0) {
                    resolve();
                } else {
                    const msg = err.join('') || `Unknown error executing command "${command}"!`;
                    reject(new Error(msg));
                }
            }

            function onStdErr(data) {
                err.push(data);
            }
        });
    }

    /** Performs a console.error call in red */
    function logError(err) {
        console.error(`\x1b[31m${err}\x1b[0m`);
    }

    /** Performs a console.log if we are in verbose mode */
    function logInfo() {
        var args, i;
        if (!argv.verbose && !argv.v) {
            return;
        }
        args = Array.prototype.slice.call(arguments);
        for (i = 0; i < args.length; i++) {
            if (typeof args[i] === 'boolean') {
                args[i] = args[i] ?
                    '\x1b[32myes\x1b[0m' :
                    '\x1b[31mno\x1b[0m';
            }
        }
        console.log.apply(console, args);
    }
}
