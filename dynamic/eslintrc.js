const appRoot = require('app-root-path'),
    path = require('path');

module.exports = function generateEslintRcContent() {
    var target = path.join(__dirname, '../reference/eslintrc');
    target = path.relative(appRoot.toString(), target);
    return `extends: "${target}"`;
};
