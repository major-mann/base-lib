const path = require('../src/path-helper.js'),
    nodePath = require('path');

module.exports = function generateEslintRcContent() {
    var target = nodePath.join(path.libraryPath(), 'reference/eslintrc');
    target = nodePath.relative(path.consumerPath(), target);
    return `extends: "./${target}"`;
};
