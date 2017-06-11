/**
 * @module Logger module. The logger module allows loggers to be created that support custom levels, and function based
 *  arguments that are only retrieved if the log level is appropriate. I abstracts creation of loggers to winston.
 */

module.exports = createLogger;
createLogger.config = globalConfig;
createLogger.transport = defineNamedTransport;

// Constants
const GENRAL_LOG = 'log',
    FUNCTION_NAME = 'name',
    UNKOWN = 'unknown',
    NODE_MODULES = 'node_modules';

// Dependecies
const winston = require('winston');

// Globals
var baseConfig, transports, projectRoot;

/** Performs 1 time global initialization setting up config defaults defining main loggers */
(function globalInit() {
    transports = { };

    defineNamedTransport('console', args => new winston.Console(args), {
        colorize: true,
        humanReadableUnhandledException: true
    });

    defineNamedTransport('file', args => new winston.File(args), {
        maxsize: 1024 * 1024,
        maxFiles: 1024,
        eol: '\n',
        logstash: false,
        tailable: true,
        maxRetries: 3,
        zippedArchive: true,
        options: {
            flags: 'a'
        }
    });

    defineNamedTransport('http', args => new winston.Http(args), {
        host: '127.0.0.1',
        port: 80,
        path: '/',
        auth: undefined,
        ssl: false
    });

    globalConfig({
        defaults: {
            exitOnError: false,
            level: 'info',
            silent: false,
            colorize: false,
            timestamp: true,
            json: false,
            stringify: false,
            prettyPrint: false,
            depth: null,
            humanReadableUnhandledException: false,
            showLevel: true,
            formatter: undefined,
            stderrLevels: ['error', 'debug']
        },
        transports: [
            { type: 'console', args: { } }
        ],
        overrides: {
            /* 'an-example-id': {
                args: {
                    level: 'debug'
                },
                transports: [
                    { type: 'console', args: { json: true } }
                ]
            }*/
        }
    });
}());

/**
 * Sets the global config to use when creating loggers. This is used as the basis for creating the options
 *  used to define the behaviour of the logger.
 */
function globalConfig(options) {
    if (options && typeof options === 'object') {
        baseConfig = options;
    }
    return baseConfig;
}

/**
 * Defines a new named transport which can be used when creating transports defined in options.
 * @param {string} type The type of transport. This will be matched with options.transports[t].type.
 * @param {function} handler The function to call to create the transport (which will be attached to
 *  the winston logger)
 * @param {object} args Optional arguments to use as base arguments (between global args and user args)
 */
function defineNamedTransport(type, handler, args) {
    if (typeof handler !== 'function') {
        throw new Error(`"handler" MUST be a "function". Got "${handler && typeof handler}"`);
    }
    transports[type] = {
        handler,
        args
    };
}

/**
 * Creates a new logger. This will create a winston logger, configure the transports according to the options,
 *  wrap the functions and return the custom logger.
 * @param {string} id The of the logger. This will be used to select overrides to apply to the created logger, and as
 *  standard tag for the logger if options.idTag is true.
 * @param {object} options The options to use when creating the logger (overrides will override these options)
 *                  * {string} projetRoot optional project root override to use.
 *                  * {boolean} idTag Set to true to make the first tag id.
 *                  * {array} tags Optional tags to use when logging. Final of these depends on the transport
 *                      being used.
 *                  * {object} args The arguments to pass to created winston loggers.
 *                  * {array} transports The transports to use for this logger. These override the global transport config.
 *                      * {string} type The type of transport
 *                      * {object} args The arguments to pass to the transport. These extend the global config defaults.
 */
function createLogger(id, options) {
    var projectRoot = determineProjectRoot();
    const logger = {};
    const winstonOptions = createWinstonOptions(id, options);
    const winstonLogger = new winston.Logger(winstonOptions);
    winstonLogger.transportLevels = determineTransportLevels();
    winstonLogger.levels.forEach(processLevel);
    return logger;

    /** Adds a handler function for the specified level */
    function processLevel(level) {
        // Log is the special general case
        const msgIndex = level === GENRAL_LOG ? 1 : 0;
        // Override the function name
        Object.defineProperty(log, FUNCTION_NAME, { value: level });
        const tags = createTags();
        if (options && options.idTag) {
            tags.unshift(id);
        }
        // Assign the (renamed) log function
        logger[level] = log;

        /** The logging handler */
        function log() {
            var args, newArgs;
            // Note: Levels are in reverse order of severity
            if (winston.levels[level] > winston.levels[winstonLogger.level]) {
                // Not logging at this level
                return;
            }
            if (!winstonLogger.transportLevels[level].length) {
                // No transport sends this level, stop processing
                return;
            }
            const args = processArgs(Array.prototype.slice.call(arguments));
            const prefix = buildPrefix(tags);
            args[msgIndex] = `${prefix} - ${args[msgIndex]}`;
            return baseLogger[level](...args);

            /** Builds the prefix to add to log lines. */
            function buildPrefix() {
                const parts = tags.slice();
                parts.push(callLocation());
                return `[${parts.join('][')}]`;
            }

            /** Sanitises the arguments before passing them along to winston */
            function processArgs(args) {
                if (args === undefined) {
                    return [];
                } else if (!Array.isArray(args)) {
                    return [args];
                } else if (args.length === 1 && typeof args[0] === 'function') {
                    return processArgs(args[0]());
                }
                // Ensure message is always a string.
                if (args[msgIndex] !== 'string') {
                    args[msgIndex] = String(args[msgIndex]);
                }
                return args;
            }
        }

        /** Chooses the correct taglist */
        function createTags() {
            var res = [];
            if (Array.isArray(overrides.tags)) {
                res = res.concat(overrides.tags);
            } else if (Array.isArray(options.tags)) {
                return options.tags;
            } else {
                return [];
            }
        }

        /** Finds the root path to use to strip absolute locations off logging. */
        function determineProjectRoot() {
            if (options.projectRoot) {
                return options.projectRoot;
            } else {
                return __dirname.split(NODE_MODULES)[0];
            }
        }
    }

    /**
     * Builds up an object which can be used to do fast lookups to see which transport levels are available to log
     *   for any arbitrary level.
     */
    function determineTransportLevels() {
        const res = {};

        // Create direct lookups
        Object.keys(logger.transports).forEach(k => res[k] = logger.transports[k].level);

        // Create reverese lookups (Note: We assume transports never share names with levels)
        Object.keys(res).forEach(assignReverseLookup);

        // Add any levels which have no transport assigned.
        levels.forEach(ensureLevel);

        return res;

        /** Adds an empty array if there are no transports defined for the level */
        function ensureLevel(l) {
            if (!res.hasOwnProperty(l)) {
                res[l] = [];
            }
        }

        /** Adds the transport to all levels it should appear in */
        function assignReverseLookup(transport) {
            var level, lidx, i;
            level = res[transport];
            lidx = levels.indexOf(level);
            for (i = lidx; i < levels.length; i++) {
                level = levels[i];
                if (res[level]) {
                    res[level].push(transport);
                } else {
                    res[level] = [transport];
                }
            }
        }
    }
}

/** Creates the options to be passed to winston */
function createWinstonOptions(id, options) {
    const overrides = baseConfig.overrides && baseConfig.overrides[id];
    const opts = merge(baseConfig.defaults, options.args, overrides && overrides.args);
    opts.transports = createTransports();
    return opts;

    function createTransports() {
        if (overrides && Array.isArray(overrides.transports)) {
            return overrides.transports
                .map(initializeTransport)
                .filter(t => !!t);
        } else if (options && Array.isArray(options.transports)) {
            return options.transports
                .map(initializeTransport)
                .filter(t => !!t);
        } else if (Array.isArray(baseConfig.transports)) {
            return baseConfig.transports
                .map(initializeTransport)
                .filter(t => !!t);
        } else {
            return [];
        }

        /** Initializes an individual transport */
        function initializeTransport(config) {
            if (config && typeof config === 'object') {
                if (transports[config.type]) {
                    const topts = merge(transports[config.type].args, config.args)
                    return transports[config.type](topts);
                } else {
                    throw new Error(`Unrecognized logging config type ${JSON.stringify(config.type)}`);
                }
            } else {
                return undefined;
            }
        }
    }
}

/**
 * Extracts a calling location for the log calls.
 */
function callLocation() {
    var stack = new Error().stack.split('\n');

    // Remove the error from the stack
    stack.shift();

    stack = stack
        .map(fileAndLocation)
        .filter(string);

    while (stack.length) {
        // Not interested in reporting this file.
        if (stack[0].startsWith(__filename)) {
            stack.shift();
        } else {
            const projectLocation = firstNonModule(stack);
            if (projectLocation) {
                return `${stack[0]} (${projectLocation})`;
            } else {
                return stack[0];
            }
        }
    }
    /* istanbul ignore next */
    return UNKOWN;
    /**
     * Attempts to extract file and location data from a stack trace line.
     */
    function fileAndLocation(val) {
        var match = STACK_FILE_PATTERN.exec(val);
        if (match && match[1]) {
            // Now to try and rebase it to the root of the project
            if (match[1].startsWith(projectRoot)) {
                return match[1].substr(projectRoot.length);
            } else {
                return match[1];
            }
        }
    }

    function firstNonModule(stack) {
        for (var i = 0; i < stack.length; i++) {
            if (stack[i].indexOf(NODE_MODULES) === -1) {
                return stack[i];
            }
        }
    }

    /** Returns true if the vcalue is a string, else false. */
    function string(val) {
        return typeof val === 'string';
    }
}

function merge(dest, source, ...args) {
    if (Array.isArray(dest) && Array.isArray(source)) {
        for (var i = 0; i < source.length; i++) {
            dest.push(source[i]);
        }
    } else if (dest && source && typeof dest === 'object' && typeof source === 'object') {
        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
                dest[prop] = merge(dest[prop], source[prop]);
            }
        }
    } else if (source !== undefined) {
        dest = source;
    }
    if (args.length) {
        dest = merge(dest, ...args);
    }
    return dest;
}
