/** @module A module for asking questions on the command line */

// Dependecies
const readline = require('readline');

// Globals
var rl;

// Expose the public API
module.exports = ask;
ask.end = () => {
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
        rl.question(question, function onAnswer(answer) {
            rl.pause();
            answer = answer || def || '';
            if (options) {
                if (typeof options === 'function') {
                    try {
                        options(answer);
                        resolve(answer);
                    } catch (ex) {
                        console.warn(`Answer "${answer}" is invalid. ${ex.message}`);
                        ask(txt, def, options).then(resolve);
                    }
                } else if (options instanceof RegExp) {
                    if (options.exec(answer)) {
                        resolve(answer);
                    } else {
                        console.warn(`Answer "${answer}" is invalid.${optionsText}`);
                    }
                } else if (options.includes(answer)) {
                    resolve(answer);
                } else {
                    console.warn(`Answer "${answer}" is invalid. Valid options are ${optionsText}`);
                    // Note: this function never rejects so we don't need to add a rejection handler.
                    ask(txt, def, options).then(resolve);
                }
            } else {
                resolve(answer);
            }
        });
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
};
