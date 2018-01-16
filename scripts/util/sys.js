/**
 * @module Bash. A module for executing commands.
 */

const MODULES = 'node_modules';

// Export the public API
module.exports = {
    consumerPath,
    exec,
    execRead,
    mkdir,
    ln,
    copy,
    exists,
    read,
    write
};

// Dependecies: WARNING WE CAN ONLY USE NODE DEPS AS SOME FUNCTIONS HERE ARE EXECUTED BEFORE WE HAVE DEPENDENCIES
const spawn = require('child_process').spawn,
    path = require('path'),
    fs = require('fs');

/** Attempts to find the path of the consumer */
function consumerPath() {
    return Promise.resolve(process.argv[1].split(MODULES)[0]);
}

/** Executes a command in the given working direcotry */
function exec(dir, command, args, err) {
    return new Promise(function promiseHandler(resolve, reject) {
        spawn(command, args, { cwd: dir, stdio: 'inherit' }).on('close', function onExecComplete(code) {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(err));
            }
        });
    });
}

/** Executes a command in the given working direcotry and resolves with a string of the captured output */
function execRead(dir, command, args, err) {
    return new Promise(function promiseHandler(resolve, reject) {
        const chunks = [];
        const proc = spawn(command, args, { cwd: dir, stdio: ['inherit', 'pipe', 'inherit'] });
        proc.stdout.on('data', onData);
        proc.on('close', onExecComplete);

        function onData(data) {
            chunks.push(data);
        }

        function onExecComplete(code) {
            if (code === 0) {
                resolve(chunks.join(''));
            } else {
                reject(new Error(err));
            }
        }
    });
}

/** Creates the specified directory if it does not exist */
function mkdir(dir) {
    return new Promise(function promiseHandler(resolve, reject) {
        fs.mkdir(dir, function onDirMade(err) {
            if (err && err.code === 'EEXIST') {
                resolve();
            } else if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/** Copies src to dest (will overwrite) */
function copy(src, dest) {
    return new Promise(function promiseHandler(resolve, reject) {
        var writeStream;
        console.info(`Creating read stream from "${src}"`);
        const readStream = fs.createReadStream(src);
        readStream.on('error', onError);
        readStream.once('readable', onReadable);

        function onReadable() {
            console.info(`Creating write stream to "${dest}"`);
            writeStream = fs.createWriteStream(dest, {
                autoClose: true
            });
            writeStream.on('open', onWriteOpened);
            writeStream.on('error', onError);
            writeStream.on('finish', resolve);

            function onWriteOpened() {
                console.info(`Piping data from "${src}" to ${dest}`);
                readStream.pipe(writeStream);
            }
        }

        /** Called if an error has occured with either stream */
        function onError(err) {
            reject(err);

            // Cleanup
            readStream.destroy();
            if (writeStream) {
                writeStream.end();
            }
        }
    });
}

/**
 * Creates a relative symlink at the destination location.
 */
function ln(src, dest) {
    // How do we (relatively) get from dest to source
    src = path.relative(dest, src);
    return new Promise(function promiseHandler(resolve, reject) {
        fs.symlink(src, dest, function onLinked(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/** Checks file existance and read write access */
function exists(file) {
    return new Promise(function promiseHandler(resolve) {
        // eslint-disable-next-line no-bitwise
        fs.access(file, fs.constants.R_OK | fs.constants.W_OK, function onAccessChecked(err) {
            resolve(!err);
        });
    });
}

function read(file) {
    return new Promise(function promiseHandler(resolve, reject) {
        fs.readFile(file, { encoding: 'utf8' }, function onFileRead(err, data) {
            if (err && err.code === 'ENOENT') {
                resolve(undefined);
            } else if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function write(file, content) {
    console.info(`Writing ${Buffer.byteLength(content)} to "${file}"`);
    return new Promise(function promiseHandler(resolve, reject) {
        fs.writeFile(file, content, function onWritten(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
