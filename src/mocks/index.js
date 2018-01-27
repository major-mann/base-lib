const cons = require('./console.js'),
    date = require('./date.js'),
    error = require('./error.js'),
    timeout = require('./timeout.js'),
    interval = require('./interval.js');

module.exports = {
    console: cons,
    date,
    error,
    timeout,
    interval
};
