/* eslint-env node */
module.exports = {
    extends: "eslint:recommended",
    "parser": "babel-eslint",
    "parserOptions": {
        "ecmaVersion": 6,
        "sourceType": "module",
    },
    "env": {
        "es6": true,
        "browser": true,
    },
    "rules": {
        "strict": 0
      }
}
