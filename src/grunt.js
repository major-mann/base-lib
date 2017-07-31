/**
 * @module Grunt. This module provides a general grunt configuration which contains the common stuff, but can be easily
 *  extended.
 */
const grunt = require('grunt');

// Constants
const MODULES = [
        'grunt-mocha-test',
        'grunt-eslint',
        'grunt-shell',
        'grunt-complexity',
        'grunt-jscpd',
        'grunt-jsonlint',
        'grunt-filenames'
    ],
    TASKS = [
        ['cover', 'shell:cover'],
        ['quality', 'filenames', 'eslint', 'jscpd', 'jsonlint'],
        ['test', 'quality', 'mochaTest:spec'],
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
            },
            single: {
                options: {
                    reporter: 'spec',
                    quiet: false,
                    clearRequireCache: true
                },
                src: [
                    'test/**/*.js',
                    grunt.option('target'),
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
            options: {
                ignorePath: '.eslintignore'
            },
            target: '.'
        },
        jscpd: {
            src: {
                path: 'src/',
                exclude: []
            },
            spec: {
                path: 'spec/',
                exclude: []
            }
        },
        jsonlint: {
            all: {
                src: ['**/*.json', '!node_modules/**'],
                options: {
                    format: true,
                    indent: 4
                }
            }
        },
        filenames: {
            options: {
                valid: /^[a-z0-9-.]+$/, // Kebab naming
                except: ['node_modules'],
                error: 'File {filename} needs to have kebab naming ({valid})'
            },
            src: ['**/*', '!node_modules/**']
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
     * @param {object} grunt The supplied grunt instace.
     */
    return function gruntInit(grunt) {
        var i, name;
        grunt.initConfig(config);
        for (i = 0; i < modules.length; i++) {
            grunt.loadNpmTasks(modules[i]);
        }
        for (i = 0; i < tasks.length; i++) {
            // Remove the name off the front of the task array
            name = tasks[i].shift();
            grunt.registerTask(name, tasks[i]);
        }
    };
};

/** Merges multiple object together */
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

    /** Copies the key if it is a value type or function, otherwise merges (by key for objects and arrays) */
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
