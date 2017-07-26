const path = require('../src/path-helper.js'),
    nodePath = require('path');

module.exports = function generateGruntFile() {
    const mainFile = nodePath.join(__dirname, '../src/grunt.js');
    const target = path.requireName(mainFile);
    return `const grunt = require('${target}');\n` +
        `module.exports = grunt([], {}, []);`;
};
