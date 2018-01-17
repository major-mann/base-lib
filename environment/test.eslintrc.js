module.exports = {
    extends: '../.eslintrc.js',
    env: {
        jasmine: true
    },
    globals: {
        chai: true,
        sinon: true,
        expect: true,
        mockery: true,
        mock: true
    },
    rules: {
        'max-len': [
            2,
            250
        ],
        'max-nested-callbacks': [
            2,
            10
        ],
        'no-magic-numbers': 0,
        'global-require': 0,
        'func-names': 0
    }
};
