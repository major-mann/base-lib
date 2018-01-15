module.exports = {
    extends: '../.eslintrc.js',
    env: {
        jasmine: true
    },
    globals: {
        chai: true
    },
    rules: {
        'max-len': [
            2,
            250
        ],
        'max-nested-callbacks': [
            2,
            5
        ],
        'no-magic-numbers': 0
    }
};
