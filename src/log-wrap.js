/**
 * @module LogWrap. The log wrap module wraps an existing log module and provides some extended functionality. This
 *  is used to ensure the supplied logging object can be used for our purposes and with our extensions. This will
 *  be used in cases where we receive a logger from a consumer of a library and wish to normalise the interface.
 */

// Dependencies
const appRoot = require('./path-helper.js'),
    moment = require('moment');

// Constants
const NODE_MODULES = 'node_modules',
    UNKNOWN = 'unknown',
    FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSS\\Z',
    STACK_PATTERN = /.*\((.*)\)/,
    DEFAULT_LEVEL = 'info',
    LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'],
    WRAPPED = Symbol('wrapped');

module.exports = wrap;

(function staticInitialization() {
    Object.defineProperty(wrap, 'DEFAULT_LEVEL', {
        enumerable: true,
        writable: false,
        value: DEFAULT_LEVEL
    });
    Object.defineProperty(wrap, 'LEVELS', {
        enumerable: true,
        writable: false,
        value: LEVELS
    });
}());

/**
 * Wraps the given log object (or function with our own log customisations)
 * @param {function|object} log The log object or function to extend. This will be used as a prototype
 *                              for an extension object which will have the following structure:
 *                                  * {function} silly An extremely verbose log level
 *                                  * {function} debug A tracing log level
 *                                  * {function} info An informative log level
 *                                  * {function} warn A log level for warnings
 *                                  * {function} error A critical error log level
 *                                  * {array} tags The tags to prefix all logs with.
 *                                  * {object} stat An object containing a statistics recording interface. Default all noop.
 *                                                  Note: any function that does no exist will be turned into a noop
 *                                      * {function} increment(name, [count], [cb]) Increments a known key
 *                                      * {function} decrement(name, [count], [cb]) Decrements a known key
 *                                      * {function} histogram(name, value, [cb]) Sets a value for a histogram
 *                                      * {function} gauge(name, value, [cb]) Sets a new value for a named gauge
 *                                      * {function} unique(name, value, [cb]) Adds a unique check for the specified name
 *                                      * {function} set(name, value, [cb]) Alias for unique
 *                                      * {function} timing(name, value, [cb]) Sets the timing for a given operation
 *
 * @param {object} options Optional options to customise how the log is extended. The following options are available
 *                             * {array} tags An array of tags which will be prefixed to the front of every log. Attached
 *                                          to the final log object as "tags".
 *                             * {object} stat A stat provider. When supplied it will be validated to ensure the required
 *                                          functions exist on the provider.
 *                             * {function} levelCheck A function which will be called when checking whether a log should
 *                                              be done or skipped. Expected signature is levelCheck(level, log)
 *                             * {boolean|string} callLocation true to add the call location. If a string is supplied,
 *                                                  it will be used as a match to trim a prefix off of all stack lines.
 *                             * {boolean|string} timestamp Truthy to add a timstamp to the prefix. If a string is supplied
 *                                                  it will be used to format the date (using moment)
 *                             * {string} projectRoot A custom location to use to strip the project root from call tracing.
 */
function wrap(log, options) {
    if (!log || typeof log !== 'object' && typeof log !== 'function') {
        throw new Error(`log MUST be assignable (function or object). Got ${log && typeof log}`);
    }
    if (log[WRAPPED]) {
        log.warn('Attempted to re-wrap log object!');
        return log;
    }
    options = prepareOptions(options);

    // Get the root to use to clear prefixes
    const projectRoot = options.projectRoot || String(appRoot);

    // Get the final functions we are interested in.
    const funcs = prepareFuncs();

    // Create the resulting log object
    const res = createReturn(log);
    res[WRAPPED] = true;
    res.stat = options.stat;

    const tags = Array.isArray(options.tags) ?
        options.tags.filter(t => t && typeof t === 'string') :
        [];
    prepareMetaProperties();

    LEVELS.forEach(l => res[l] = wrapLevel(res, funcs, l));
    return res;

    /** Adds the meta properties to the result */
    function prepareMetaProperties() {
        var level = wrap.DEFAULT_LEVEL,
            useBaseLevel = false;
        if ('level' in log) {
            try {
                validateLevel(log.level);
                useBaseLevel = true;
                level = log.level;
            } catch (ex) {
                // Do nothing (useBaseLevel already false)
            }
        }
        const levelsObject = {};
        LEVELS.forEach((l, i) => levelsObject[l] = i);
        Object.defineProperty(res, 'levels', {
            enumerable: true,
            writable: false,
            value: levelsObject
        });
        Object.defineProperty(res, 'level', {
            enumerable: true,
            get: () => level,
            set: setLevel
        });
        Object.defineProperty(res, 'tags', {
            enumerable: true,
            writable: false,
            value: tags
        });

        /** Upodates the level variable and the base log level if it has one */
        function setLevel(l) {
            level = validateLevel(l);
            if (useBaseLevel) {
                log.level = level;
            }
        }
    }

    /**
     * Performs a wrap of an individual log level.
     */
    function wrapLevel(res, funcs, level) {
        Object.defineProperty(wrap, 'name', { value: funcs[level].name });
        Object.defineProperty(wrap, 'length', { value: funcs[level].length });
        return wrap;

        function wrap() {
            var args, prefix;
            if (res.levels[res.level] < res.levels[level]) {
                // Bail out since level is too low
                return false;
            }

            // Allow the consumer a last chance to bail out.
            if (!options.levelCheck(level, res)) {
                return false;
            }

            if (arguments.length === 1 && typeof arguments[0] === 'function') {
                args = arguments[0]();
                if (!Array.isArray(args)) {
                    args = [args];
                }
            } else {
                args = [...arguments];
            }

            prefix = tags.slice();
            processCallLocation();
            processTimestamp();

            // Note: We assume message is the first argument
            prefix = preparePrefix();

            if (typeof args[0] !== 'string') {
                args[0] = String(args[0]);
            }
            args[0] = prefix + args[0];

            // Do the log
            funcs[level].apply(log, args);
            return true;

            function preparePrefix() {
                if (prefix.length) {
                    return `[${prefix.join('][')}]`;
                } else {
                    return '';
                }
            }

            function processCallLocation() {
                if (options.callLocation) {
                    const cloc = callLocation();
                    prefix.unshift(cloc);
                }
            }

            function processTimestamp() {
                if (options.timestamp) {
                    const format = typeof options.timestamp === 'string' ?
                        options.timestamp :
                        FORMAT;
                    const ts = moment()
                        .utc()
                        .format(format);
                    prefix.unshift(ts);
                }
            }
        }
    }

    function validateLevel(name) {
        if (!LEVELS.includes(name)) {
            throw new Error(`level "${name}" is invalid. Valid options are: ${LEVELS.join()}`);
        }
        return name;
    }

    function createReturn(log) {
        if (typeof log === 'function') {
            const res = function res() {
                return log(...arguments);
            };
            Object.defineProperty(res, 'name', { value: log.name });
            Object.defineProperty(res, 'length', { value: log.length });
            Object.setPrototypeOf(res, log);
            return res;
        } else {
            return Object.create(log);
        }
    }

    /** Gets the location of the caller  */
    function callLocation() {
        var stack = new Error().stack.split('\n');

        // Remove the error from the stack
        stack.shift();

        stack = stack.map(fileAndLocation)
            .filter(string);

        while (stack.length) {
            // Not interested in reporting this file.
            if (stack[0].startsWith(__filename)) {
                stack.shift();
            } else {
                stack = stack.map(stripProjectRoot);
                const projectLocation = firstNonModule(stack);
                if (projectLocation) {
                    return `${stack[0]} (${projectLocation})`;
                } else {
                    return stack[0];
                }
            }
        }
        /* istanbul ignore next */
        return UNKNOWN;

        /**
         * Attempts to extract file and location data from a stack trace line.
         */
        function fileAndLocation(val) {
            var match = STACK_PATTERN.exec(val);
            if (match && match[1]) {
                return match[1];
            } else {
                return undefined;
            }
        }

        function stripProjectRoot(val) {
            const strip = typeof options.callLocation === 'string' ?
                options.callLocation :
                projectRoot;

            if (val.startsWith(strip)) {
                return val.substr(strip.length);
            } else {
                return val;
            }
        }

        /** Returns the first entry that does not have "node_modules" in it's path */
        function firstNonModule(stack) {
            for (let i = 0; i < stack.length; i++) {
                if (stack[i].indexOf(NODE_MODULES) === -1) {
                    if (i === 0) {
                        // We want to return undefined since the project location is the location of the log.
                        break;
                    }
                    return stack[i];
                }
            }
            return undefined;
        }

        /** Returns true if the value is a string, else false. */
        function string(val) {
            return typeof val === 'string';
        }
    }

    function prepareFuncs() {
        var i, current;
        const funcs = {};
        LEVELS.forEach(level => funcs[level] = log[level]);

        // First we need to ensure that error has a function
        for (i = 0; i < LEVELS.length; i++) {
            if (typeof funcs[LEVELS[i]] === 'function') {
                funcs[LEVELS[0]] = funcs[LEVELS[i]];
                break;
            }
        }
        if (i === LEVELS.length) {
            throw new Error(`No valid levels found on the supplied log object! (${LEVELS.join()})`);
        }
        current = funcs[LEVELS[0]];
        for (i = 1; i < LEVELS.length; i++) {
            if (typeof funcs[LEVELS[i]] === 'function') {
                current = funcs[LEVELS[i]];
            } else {
                funcs[LEVELS[i]] = current;
            }
        }
        return funcs;
    }

    /** Ensures options are checked for validity and normalised to make consumption simpler */
    function prepareOptions(options) {
        if (options && typeof options !== 'object' && typeof options !== 'function') {
            throw new Error(`When supplied options MUST be assignable (object or function) Got ${typeof options}`);
        }
        options = options || {};
        options = Object.assign({}, options);

        if (options.levelCheck) {
            if (typeof options.levelCheck !== 'function') {
                throw new Error(`When supplied options.levelCheck MUST be a function`);
            }
        }
        options.levelCheck = options.levelCheck || (() => true);
        prepareStat();
        return options;

        function prepareStat() {
            if (options.stat) {
                if (typeof options.stat !== 'object' && typeof options.stat !== 'function') {
                    throw new Error('when supplied options.stat MUST be assignable (function or object). ' +
                        `Got ${options.stat && typeof options.stat}`);
                }
            }
            options.stat = Object.assign({}, options.stat);
            ensureStatFunction('increment');
            ensureStatFunction('decrement');
            ensureStatFunction('histogram');
            ensureStatFunction('gauge');
            ensureStatFunction('timing');
            ensureStatFunction('set');
            ensureStatFunction('unique');
        }

        function ensureStatFunction(name) {
            if (options.stat[name] && typeof options.stat[name] !== 'function') {
                throw new Error(`When supplied options.stat.${name} MUST be a function. ` +
                    `Got ${options.stat[name] && typeof options.stat[name]}`);
            }
            options.stat[name] = options.stat[name] || noop;
        }
    }

    /** Does nothing special. Just calls the last parameter if it is a function */
    function noop() {
        if (typeof arguments[arguments.length - 1] === 'function') {
            arguments[arguments.length - 1]();
        }
    }
}
