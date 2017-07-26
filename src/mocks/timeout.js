const origSetTimeout = global.setTimeout,
    origClearTimeout = global.clearTimeout;

module.exports = function createMock() {
    // Globals
    var timeouts = [];

    // Assign the extension functions
    setTimeout.$flush = flush;
    setTimeout.$verifyNoPendingTasks = verifyNoPendingTasks;

    // Expose the public API
    return {
        setTimeout,
        clearTimeout
    };

    /**
     * Sets a timeout, recording it's details so it can be manually flushed if desired.
     * @param {function} handler The timeout handler to execute
     * @param {number} delay Optional number of milliseconds to delay the flush for.
     * @param {...} args Arguments to pass to the handler on execution
     */
    function setTimeout(handler, delay, ...args) {
        const reference = origSetTimeout(handlerIntercept, delay);
        const execHandler = () => handler(...args);
        insert(execHandler, reference, delay);
        return reference;

        /** Ensures the handler is removed from timeouts so it doesn't get flushed */
        function handlerIntercept() {
            removeTimeout(reference);
            execHandler();
        }
    }

    function clearTimeout(reference) {
        removeTimeout(reference);
        return origClearTimeout(reference);
    }

    function removeTimeout(reference) {
        for (let i = 0; i < timeouts.length; i++) {
            if (timeouts[i].reference === reference) {
                timeouts.splice(i, 1);
            }
        }
    }

    function flush(delay) {
        if (delay > 0) {
            origSetTimeout(() => flush(), delay);
        } else {
            while (timeouts.length) {
                const timeout = timeouts.shift();
                origClearTimeout(timeout.reference);
                timeout.handler();
            }
        }
    }

    function verifyNoPendingTasks() {
        if (timeouts.length) {
            throw new Error(`There are ${timeouts.length} pending timers`);
        }
    }

    function insert(handler, reference, delay) {
        timeouts.push({
            handler,
            reference,
            delay
        });
    }
};
