const path = require('../src/path-helper.js');

module.exports = function generateGruntFile() {
    const target = path.srcPath();
    return `const grunt = require('${target}').grunt;\n` +
        `module.exports = grunt([], {}, []);\n`;
};
