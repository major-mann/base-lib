module.exports = function createMock() {
    const intervals = [];

    mockSetInterval.$flush = flush;
    mockSetInterval.$clear = clear;

    return {
        setInterval: mockSetInterval,
        clearInterval: mockClearInterval
    };

    function mockSetInterval(handler, delay, ...args) {
        const execHandler = () => handler(...args);
        const interval = createNewInterval(execHandler, delay, args);
        intervals.push(interval);
        return interval.reference;
    }

    function mockClearInterval(reference) {
        for (let i = 0; i < intervals.length; i++) {
            if (intervals[i].reference === reference) {
                intervals[i].clear();
                intervals.splice(i, 1);
            }
        }
    }

    function flush(delay) {
        Object.keys(intervals).map(inter => intervals[inter].flush(delay));
    }

    function clear() {
        Object.keys(intervals).map(inter => intervals[inter].clear());
    }

    function createNewInterval(handler, delay) {
        var start, offset, waiting, waitingProxy;
        start = Date.now();
        offset = delay;
        waiting = setTimeout(onTick, delay);
        const traps = {};
        Reflect.ownKeys(Reflect).forEach(k => traps[k] = createTrap(k));
        waitingProxy = new Proxy({}, traps);

        return {
            handler,
            delay,
            reference: waitingProxy,
            flush: flushInterval,
            clear: clearWaiting
        };

        function createTrap(name) {
            return function trap(target, ...args) {
                return Reflect[name](waiting, ...args);
            };
        }

        function onTick() {
            // TODO: Would be nice to deal with creep
            start = Date.now();
            offset = delay;
            waiting = setTimeout(onTick, delay);
            handler();
        }

        function clearWaiting() {
            clearTimeout(waiting);
        }

        function flushInterval(ms) {
            if (ms > 0 === false) {
                return;
            }
            const newStart = Date.now();
            const diff = newStart - start;
            start = newStart;
            offset = offset - diff;
            clearTimeout(waiting);
            if (ms < offset) {
                // We will not trigger any handlers
                offset = offset - ms;
                waiting = setTimeout(onTick, offset);
                return;
            }

            ms = ms - offset;
            offset = delay - ms % delay;
            let count = Math.floor(ms / delay) + 1;
            waiting = setTimeout(onTick, offset);
            while (count--) {
                handler();
            }
        }
    }
};
