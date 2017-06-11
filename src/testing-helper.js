/**
 * @module Testing helper. Used to provide common test initialization.
 */

// Load middleware and modules to expose.
const chai = require('chai'),
    spies = require('chai-spies'),
    cap = require('chai-as-promised');

module.exports = function intializeChaiEnvironment() {
    // Add middleware to chai
    chai.use(spies);
    chai.use(cap);

    // Exose chai, and it's expect function as global variables
    global.chai = chai;
    global.expect = chai.expect;
};
