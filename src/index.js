/** @module Index. The index module provides a common entry point for consumers to be able to use the public API */

module.exports = {
    grunt: require('./grunt.js'),
    logWrap: require('./log-wrap.js'),
    testingHelper: require('./testing-helper.js')
};
