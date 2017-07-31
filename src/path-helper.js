// Expose the public API
module.exports = {
    consumerPath,
    libraryPath,
    srcPath,
    requireName,
    resolve,
    toString: consumerPath
};

// Constants
const NODE_MODULES = 'node_modules';

// Dependecies
const path = require('path'),
    appRoot = require('app-root-path'),
    npmPackage = require('../package.json');

/** Gets the value to use  */
function consumerPath() {
    const parts = process.argv[1].split(NODE_MODULES);
    let res;
    if (parts.length > 1) {
        res = parts[0];
    } else {
        res = appRoot.toString();
    }
    if (!res.endsWith('/')) {
        res += '/';
    }

    const prefix = globalPrefix();
    if (res.startsWith(prefix)) {
        // Global, go with CWD
        return process.cwd();
    } else {
        return res;
    }

    function globalPrefix() {
        const gpath = process.env._;
        if (gpath) {
            return path.join(gpath, '../..');
        } else {
            return undefined;
        }
    }
}

/** Gets the path of this library as referenced from the consumer. */
function libraryPath() {
    return `${consumerPath()}${NODE_MODULES}/${npmPackage.name}`;
}

function srcPath() {
    const parts = process.argv[1].split(NODE_MODULES);
    if (parts.length > 1) {
        return npmPackage.name;
    } else {
        return './src';
    }
}

/** Gets the value to use in require to reference the module */
function requireName(from) {
    const parts = from.split(NODE_MODULES);
    const root = path.join(__dirname, '..');
    if (parts.length === 1) {
        // We are consuming ourselves.
        if (from) {
            return `./${path.relative(root, from)}`;
        } else {
            return root;
        }
    } else {
        // We need everything from the first node modules
        return parts
            .slice(1)
            .join(NODE_MODULES)
            .slice(1); // This get's rid of leading /
    }
}

function resolve(to) {
    const root = consumerPath();
    return path.resolve(root, to);
}
