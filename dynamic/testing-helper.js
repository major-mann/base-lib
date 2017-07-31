const path = require('../src/path-helper.js');

module.exports = function generateTestingHelper() {
    const target = path.srcPath();
    return '/** @module Testing Helper. Used to run common test initialization before testing begins */\n' +
        `const helper = require('${target}').testingHelper;\n` +
        '// This initializes chai middleware and adds chai and expect to the global object\n' +
        'helper();\n';
};
