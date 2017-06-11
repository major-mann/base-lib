/** @module Root Path. This module finds and returns the root path of the project */

// Dependecies
const path = require('path');


/** Attempts to find the ultimate consumer root path from the given directory (Does not handle symlinks) */
function consumer(directory, fallback) {
    directory = directory || path.join(__dirname, '../..');
    return directory.split('node_modules')[0];






    // TODO: We are looking for the first node modules in the path.... Then plus 1 or 2 (depending on whether the is a
    //  scope or not)


}
