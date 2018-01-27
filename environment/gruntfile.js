/**
 * @module Grunt. This module provides a general grunt configuration which contains the common stuff, but can be easily
 *  extended.
 */

// Constants
const MODULES = [
        'grunt-mocha-test',
        'grunt-eslint',
        'grunt-shell',
        'grunt-complexity',
        'grunt-jscpd',
        'grunt-jsonlint'
    ],
    TASKS = [
        ['test', 'quality', 'mochaTest:spec'],
        ['cover', 'shell:cover'],
        ['quality', 'eslint', 'jscpd', 'jsonlint'],
        ['default', 'test', 'cover']
    ],
    CONFIG = {
        mochaTest: {
            spec: {
                options: {
                    reporter: 'spec',
                    quiet: false,
                    clearRequireCache: true
                },
                src: [
                    'test/**/*.js',
                    'test/**/*.spec.js',
                    '!test/mocks',
                    '!node_modules/**/*.js'
                ]
            }
        },
        shell: {
            cover: 'istanbul --include-all-sources cover grunt test',
            options: {
                stdout: false,
                stderr: false,
                preferLocal: true
            }
        },
        eslint: {
            options: { ignorePath: '.eslintignore' },
            target: '.'
        },
        jscpd: {
            javascript: {
                path: 'src/',
                exclude: []
            },
            spec: {
                path: 'spec/',
                exclude: ['scrap/**']
            }
        },
        jsonlint: {
            all: {
                src: ['**/*.json'],
                options: {
                    format: true,
                    indent: 4
                }
            }
        }
    };

/**
 * Initializes grunt with the standard configuration extended by the supplied configuration.
 * @param {array} modules The additional modules to load using loadNpmTasks
 * @param {object} config An object to extend the default config with. The combined result
 *  will be passed to grunt.initConfig. Note: The objects are merged with lodash.merge.
 * @param {array} tasks An array of arrays with each sub array containing the task name first,
 *  then each of the sub tasks to be executed for that task.
 * @returns {function} The grunt initialization function
 */
module.exports = function grunt(modules, config, tasks) {
    config = merge({}, CONFIG, config);
    modules = MODULES.concat(modules);
    tasks = TASKS.concat(tasks);

    /**
     * Initializes grunt with the built config.
     * @param {object} gruntApp The supplied grunt instace.
     */
    return function gruntInit(gruntApp) {
        var i, name;
        gruntApp.initConfig(config);
        for (i = 0; i < modules.length; i++) {
            gruntApp.loadNpmTasks(modules[i]);
        }
        for (i = 0; i < tasks.length; i++) {
            // Remove the name off the front of the task array
            name = tasks[i].shift();
            gruntApp.registerTask(name, tasks[i]);
        }
    };
};

/**
 * Merges multiple object together.
 * @param {object} target The object to merge the data onto
 * @param {object} src The src to get the data from
 * @returns {object} The result of the merge.
 */
function merge(target, src) {
    if (!target && typeof target !== 'object') {
        return target;
    }
    if (src && typeof src === 'object') {
        Object.keys(src).forEach(processKey);
    }
    if (arguments.length > 2) {
        const args = Array.prototype.slice.call(arguments);
        args.splice(1, 1);
        return merge(...args);
    } else {
        return target;
    }

    /**
     * Copies the key if it is a value type or function, otherwise merges (by key for objects and arrays)
     * @param {string} key The name of the property to process.
     * @returns {object} The target.
     */
    function processKey(key) {
        const tobj = target[key] && typeof target[key] === 'object';
        const sobj = src[key] && typeof src[key] === 'object';
        if (tobj && sobj) {
            target[key] = merge(target[key], src[key]);
        } else {
            target[key] = src[key];
        }
        return target;
    }
}
