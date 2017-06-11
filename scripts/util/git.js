/**
 * @module Git script utilitities. This module contains functions useful for working with git repositories.
 */

// Expose the public API
module.exports = {
    installed,
    initialized,
    initialize,
    uncommittedChanges,
    flowInstalled,
    flowInitialized,
    initializeFlow,
    commitAll,
    origin
};

// Constants
const GIT = 'git';

// Dependecies
const parseGitConfig = require('parse-git-config'),
    commandExists = require('command-exists'),
    sys = require('./sys.js'),
    path = require('path'),
    fs = require('fs');

/**
 * Checks whether a git command is available on the current system.
 */
function installed() {
    return new Promise(function promiseHandler(resolve, reject) {
        commandExists(GIT, (err, exists) => err ? reject(err) : resolve(exists));
    });
}

/** Checks whether the supplied directory has been initialized as a GIT repository */
function initialized(dir) {
    return new Promise(function promiseHandler(resolve) {
        const gitPath = path.join(dir, '.git/config');
        // eslint-disable-next-line no-bitwise
        fs.access(gitPath, fs.constants.R_OK | fs.constants.W_OK, err => resolve(!err));
    });
}

/** Initializes the supplied directory as a git directory */
function initialize(dir) {
    // Initilialize git of it has not already been initialized
    return initialized(dir).then(initialized => initialized || doInitGit());

    /** Init and perform initial commit */
    function doInitGit() {
        return sys.exec(dir, 'git', ['init'], 'Failed to initialize GIT')
            .then(() => commitAll(dir, 'Initial commit'));
    }
}

function uncommittedChanges(dir) {
    // Initilialize git of it has not already been initialized
    return installed()
        .then(installed => installed && initialized(dir))
        .then(initialized => initialized && doChangesCheck());

    /** Init and perform initial commit */
    function doChangesCheck() {
        return sys.execRead(dir, 'git', ['status', '--porcelain'], 'Failed to check for changes')
            .then(txt => txt.split('\n').filter(l => !!l).length > 0);
    }
}

function flowInstalled(dir) {
    return sys.exec(dir, 'git', ['flow', 'version'], '')
        .then(() => true)
        .catch(() => false);
}

/** Checks whether git flow is initialized in the specified directory */
function flowInitialized(dir) {
    return new Promise(function promiseHandler(resolve, reject) {
        parseGitConfig({ cwd: dir, path: '.git/config' }, function onParsed(err, config) {
            if (err && err.code === 'ENOENT') {
                resolve(undefined);
            } else if (err) {
                reject(err);
            } else {
                const branchConfig = config['gitflow "branch"'];
                resolve(!!branchConfig);
            }
        });
    });
}

/** Initializes git flow in the specified directory */
function initializeFlow(dir, silent) {
    return flowInitialized(dir).then(initialized => initialized || doInitGitFlow());

    /** Initialize git flow */
    function doInitGitFlow() {
        const args = ['flow', 'init'];
        if (silent) {
            args.push('-d');
        }
        return sys.exec(dir, 'git', args, 'Failed to initialize git flow');
    }
}

/** Commits all files in the supplied directory */
function commitAll(dir, message) {
    return sys.exec(dir, 'git', ['add', '.'], 'Failed to add files')
        .then(() => sys.exec(dir, 'git', ['commit', '-m', message], 'Failed to perform commit'));
}

/** Finds the origin (if it exists) for the git repo in the specified directory */
function origin(dir) {
    return new Promise(function promiseHandler(resolve, reject) {
        parseGitConfig({ cwd: dir, path: '.git/config' }, function onParsed(err, config) {
            if (err && err.code === 'ENOENT') {
                resolve(undefined);
            } else if (err) {
                reject(err);
            } else {
                const remote = config['remote "origin"'];
                resolve(remote && remote.url);
            }
        });
    });
}
