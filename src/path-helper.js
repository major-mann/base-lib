// Expose the public API
module.exports = {
    consumerPath,
    requireName,
    resolve,
    toString: consumerPath
};

// Constants
const NODE_MODULES = 'node_modules';

// Dependecies
const path = require('path'),
    appRoot = require('app-root-path');

/** Gets the value to use  */
function consumerPath() {
    const parts = __dirname.split(NODE_MODULES);
    if (parts.length > 1) {
        return `${parts[0]}/`;
    } else {
        return `${appRoot.toString()}/`;
    }
}

/** Gets the value to use in require to reference the module */
function requireName(from) {
    const parts = __dirname.split(NODE_MODULES);
    const root = path.join(__dirname, '..');
    if (parts.length === 1) {
        // We are consuming ourselves.
        if (from) {
            return `./${path.relative(root, from)}`;
        } else {
            return root;
        }
    } else {
        // We need the relative name between the last node_modules and the project root.
        const base = parts.slice(0, parts.length - 2).join(NODE_MODULES);
        return path.relative(base, root).replace(/\\/g, '/');
    }
}

function resolve(to) {
    const root = consumerPath();
    return path.resolve(root, to);
}
