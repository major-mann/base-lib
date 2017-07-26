#!/usr/bin/env node
const path = require('path');
const sys = require('./util/sys.js');
const ask = require('./util/ask.js');
const appRoot = path.join(path.dirname(process.argv[1]), '../').split('node_modules')[0];

console.info('Running base post install script');
sys.exists(path.join(appRoot, 'package.json'))
    .then(exists => exists ? console.info('Skipping auto environment preparation as environment unclean') : askAndExecute())
    .catch(onError);

function askAndExecute() {
    return ask('This appears to be a fresh install. Would you like to run prepare-environment', 'y', ['y', 'n'])
        .then(ans => ans === 'y' && require('./prepare-environment.js'));
}

function onError(err) {
    console.error(`An error occured in the post install script: ${err && err.stack || err}`);
}
