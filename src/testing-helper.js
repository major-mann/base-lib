/**
 * @module Testing helper. Used to provide common test initialization.
 */

// Load middleware and modules to expose.
const chai = require('chai'),
    spies = require('chai-spies'),
    cap = require('chai-as-promised'),
    mockery = require('mockery'),
    mocks = require('./mocks');

module.exports = function intializeChaiEnvironment() {
    const globals = {
        Error,
        Date,
        console,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval
    };
    const extendedRestore = {
        Date: {
            now: Date.now
        },
        console: {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            dir: console.dir,
            time: console.time,
            timeEnd: console.timeEnd,
            trace: console.trace,
            assert: console.assert
        }
    };

    // Add middleware to chai
    chai.use(spies);
    chai.use(cap);

    // Exose chai, and it's expect function as global variables
    global.chai = chai;
    global.expect = chai.expect;
    global.mockery = mockery;
    global.mock = mocks;

    global.beforeEach(function beforeEveryTest() {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });

        global.chai.spy.callsback = function callsback(err, result, optional) {
            return chai.spy(function callbackHandler() {
                if (optional && typeof arguments[arguments.length - 1] !== 'function') {
                    return;
                }
                arguments[arguments.length - 1](err, result);
            });
        };
    });

    global.afterEach(function afterEveryTest() {
        mockery.deregisterAll();
        mockery.disable();

        // Ensure globals are reset
        restore(global, globals);
        Object.keys(extendedRestore).forEach(k => resoreExtended(global[k], extendedRestore[k]));
    });

    /** Restores the globals to their original values */
    function restore(obj, vals) {
        Object.keys(vals).forEach(k => obj[k] = vals[k]);
    }

    function resoreExtended(obj, vals) {
        Object.keys(vals).forEach(k => obj[k] = vals[k]);
    }
};
