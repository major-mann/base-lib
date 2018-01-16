module.exports = {
    extends: ['@gmsllc-private/eslint-config'],
    parserOptions: {
        ecmaFeatures: {
            impliedStrict: true
        },
    },
    rules: {
        'no-magic-numbers': 0,
        'object-curly-newline': [2, {
            multiline: true,
            consistent: true
        }],
        'no-return-assign': 0,
        indent: [
            2,
            4,
            { SwitchCase: 1 }
        ],
        'max-len': [2, 125, 4, {
            ignoreUrls: true,
            ignoreComments: false,
            ignoreRegExpLiterals: true
        }],
        'valid-jsdoc': 0,
        'no-mixed-operators': 0,
        'prefer-arrow-callback': 0
    }
};
