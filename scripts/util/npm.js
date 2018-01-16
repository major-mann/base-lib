/** @module NPM. A module for working with NPM */

// Public exports
module.exports = {
    install,
    author
};

// Constants
const INIT_AUTHOR_EMAIL = 'init.author.email',
    INIT_AUTHOR_NAME = 'init.author.name';

// Module dependencies
const npm = require('npm');

// Project dependencies
const sys = require('./sys.js');

function install(dir, packages) {
    packages = packages || [];
    const args = ['install'].concat(packages);
    return sys.exec(dir, 'npm', args, `Unable to install packages ${packages.join(', ')}`);
}

/** Get's author details */
function author() {
    return new Promise(function promiseHandler(resolve, reject) {
        npm.load(function onLoaded(err) {
            if (err) {
                reject(err);
            } else {
                const email = npm.config.get(INIT_AUTHOR_EMAIL);
                const name = npm.config.get(INIT_AUTHOR_NAME);
                resolve({
                    name,
                    email
                });
            }
        });
    });
}
