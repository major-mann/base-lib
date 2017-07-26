/** @module A module for asking questions on the command line */

// Dependecies
const readline = require('readline');

// Globals
var rl;

// Expose the public API
module.exports = ask;
ask.end = function end() {
    if (rl) {
        rl.close();
        rl = undefined;
    }
};

function ask(txt, def, options) {
    const optionsText = createOptionsText();
    const postfix = createPostfix();
    const question = `${txt}${postfix}? `;

    if (!rl) {
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.on('SIGINT', () => process.exit(-1));
    }

    return new Promise(function promiseHandler(resolve) {
        rl.question(question, onAnswer);

        /** Called once the user has typed a response and pushes enter */
        function onAnswer(answer) {
            rl.pause();
            answer = answer || def || '';
            if (options) {
                return processOptions(answer)
                    .then(resolve);
            } else {
                return resolve(answer);
            }
        }

        /** Processes the answer according to the received options */
        function processOptions(answer) {
            if (typeof options === 'function') {
                return checkFunction(answer);
            } else if (options instanceof RegExp) {
                return checkRegExp(answer);
            } else if (options.includes(answer)) {
                return Promise.resolve(answer);
            } else {
                console.warn(`Answer "${answer}" is invalid. Valid options are ${optionsText}`);
                // Note: this function never rejects so we don't need to add a rejection handler.
                return ask(txt, def, options);
            }
        }

        /** Checks the answer through an options funciton */
        function checkFunction(answer) {
            try {
                const res = options(answer);
                if (res instanceof Promise) {
                    return res;
                } else {
                    return Promise.resolve(res);
                }
            } catch (ex) {
                console.warn(`Answer "${answer}" is invalid. ${ex.message}`);
                return ask(txt, def, options);
            }
        }

        /** Checks the answer through an options regexp */
        function checkRegExp(answer) {
            if (options.exec(answer)) {
                return Promise.resolve(answer);
            } else {
                console.warn(`Answer "${answer}" is invalid.${optionsText}`);
                return ask(txt, def, options);
            }
        }
    });

    function createOptionsText() {
        if (Array.isArray(options)) {
            return options.map(o => o.toLowerCase() === def.toLowerCase() ? `[${o}]` : o).join(', ');
        } else if (options instanceof RegExp) {
            const defText = def && ` [${def}]` || '';
            return `Must match ${options.source}${defText}`;
        } else {
            return '';
        }
    }

    /** Creates the meta text to follow the question */
    function createPostfix() {
        if (optionsText) {
            return ` (${optionsText})`;
        } else if (def) {
            return ` [${def}]`;
        } else {
            return '';
        }
    }
}
