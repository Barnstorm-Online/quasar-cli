module.exports = {
    root: true,
    parserOptions: {
        sourceType: 'module'
    },
    env: {
        node: true
    },
    extends: [
        // https://github.com/standard/standard/blob/master/docs/RULES-en.md
        'standard'
    ],
    globals: {},
    // add your custom rules here
    'rules': {
        'brace-style': [2, 'stroustrup', { 'allowSingleLine': true }],

        // // allow async-await
        // 'generator-star-spacing': 'off',

        // allow paren-less arrow functions
        'arrow-parens': 0,
        'one-var': 0,

        'prefer-promise-reject-errors': 0,

        // allow debugger during development
        'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
    }
}