module.exports = function createMock() {
    var output = true,
        res = {};

    res.$output = outputLogs;
    res.log = createLogFunction('log');
    res.info = createLogFunction('info');
    res.warn = createLogFunction('warn');
    res.error = createLogFunction('error');
    res.dir = createLogFunction('dir');
    res.time = createLogFunction('time');
    res.timeEnd = createLogFunction('timeEnd');
    res.trace = createLogFunction('trace');
    res.assert = createLogFunction('assert');

    return res;

    function outputLogs(o) {
        if (arguments.length) {
            output = !!o;
        }
        return output;
    }

    function createLogFunction(name) {
        return global.chai.spy(function consoleIntercep() {
            if (output) {
                // eslint-disable-next-line no-console
                console[name](...arguments);
            }
        });
    }
};
