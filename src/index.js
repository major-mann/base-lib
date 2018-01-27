/** @module Index. The index module provides a common entry point for consumers to be able to use the public API */

const grunt = require('./grunt.js'),
    logWrap = require('./log-wrap.js'),
    testingHelper = require('./testing-helper.js');

module.exports = {
    grunt,
    logWrap,
    testingHelper
};
