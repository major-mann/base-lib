#!/usr/bin/env node

/**
 * @module Environment preparation script. This script is responsible for taking a target project, copying
 *  required config and code files and preparing the directory structure.
 */

const depends = require('./prepare-dependencies.js');
depends()
    .then(prepEnv)
    .catch(err => console.error(`Unable to prepare environment! ${err.stack}`));

function prepEnv() {
    // Constants
    const PACKAGE_SPACE = 4,
        LINK_ARG = 'ln',
        HEADING_LENGTH = 20,
        VERSION_PART_COUNT = 3,
        // TODO: Maybe this should be a license file and SEE LICENSE IN license.. Maybe all rights reserved?
        LICENSE = 'GPL-3.0',
        VERSION = '0.0.1',
        NONE = 'none',
        ENTRY = 'src/index.js',
        VERSION_MATCH = /^\d+\.\d+\.\d+$/,
        FREE_VERSION_MATCH = /\d+\.\d+\.\d+/,
        EMAIL_MATCH = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        URI_MATCH = /^(([^:/?#]+):)(\/\/([^/?#]*))([^?#]*)(\?([^#]*))?(#(.*))?/;

    // Dependecies
   const minimist = require('minimist'),
       npmMod = require('npm'),
       path = require('path'),
       fs = require('fs'),
       sys = require('./util/sys.js'),
       git = require('./util/git.js'),
       npm = require('./util/npm.js'),
       ask = require('./util/ask.js'),
       sourcePackage = require('../package.json');

    // Globals
    let local, argv, destPackage;

    return sys.consumerPath()
        .then(prepareEnvironment)
        .catch(function onError(err) {
            console.error(err.stack);
            throw err;
        });

    function prepareEnvironment(appRoot) {
        argv = minimist(process.argv.slice(2));

        if (argv.help) {
            console.info(`Usage: prepare-environment [options] [ln]`);
            console.info('\tln Link files instead of copying where appropriate');
            console.info('\t--silent Use all defaults');
            console.info('\t--nowrite Do everything except persist changes');
            console.info('\t--v Verbose');
            console.info('\t--vv More verbose');
            console.info('\t--vvv Most verbose');
            process.exit(0);
            return undefined;
        }

        if (argv.v) {
            console.trace = noop;
            console.info = noop;
        } else if (argv.vv) {
            console.trace = noop;
        } else if (!argv.vvv) {
            console.trace = noop;
            console.info = noop;
            console.warn = noop;
        }
        local = appRoot === path.join(__dirname, '../');

        console.info(`Preparing environment for project rooted at "${appRoot}"`);

        // Create structure
        return git.uncommittedChanges(appRoot)
            .then(checkChanges)
            .then(() => heading('Structure'))
            .then(() => mkdir(appRoot, 'src'))
            .then(() => keep(appRoot, 'src'))
            .then(() => mkdir(appRoot, 'test'))
            .then(() => mkdir(appRoot, 'test/mocks'))
            .then(() => keep(appRoot, 'test/mocks'))
            // Dynamically generated files
            .then(() => heading('Files'))
            .then(() => dynamic(appRoot, 'gruntfile', 'gruntfile.js', true))
            .then(() => dynamic(appRoot, 'nvmrc', '.nvmrc', true))
            .then(() => dynamic(appRoot, 'testing-helper', 'test/testing-helper.js', true))
            .then(() => dynamic(appRoot, 'readme', 'readme.md', true))
            // File copies (or links if LINK_ARG was supplied)
            .then(() => fileLink(appRoot, 'environment/npmrc', '.npmrc', true))
            .then(() => fileLink(appRoot, 'environment/gitignore', '.gitignore', true))
            .then(() => fileLink(appRoot, 'environment/eslintignore', '.eslintignore', true))
            .then(() => fileLink(appRoot, 'environment/editorconfig', '.editorconfig', true))
            .then(() => fileLink(appRoot, 'environment/istanbul.yml', '.istanbul.yml', true))
            .then(() => fileLink(appRoot, 'environment/mocha.opts', 'test/mocha.opts', true))
            // Copied files
            .then(() => copy(appRoot, 'environment/eslintrc.js', '.eslintrc.js', true))
            .then(() => copy(appRoot, 'environment/test.editorconfig', 'test/.editorconfig', true))
            .then(() => copy(appRoot, 'environment/test.eslintrc.js', 'test/.eslintrc.js', true))
            // Package.json
            .then(() => heading('Package.json'))
            .then(() => loadPackageJson(appRoot))
            .then(created => updatePackageJson(appRoot, created))
            .then(() => savePackageJson(appRoot))
            .then(() => npmInstall(appRoot))
            // Git
            .then(() => heading('GIT'))
            .then(() => gitPrep(appRoot));
    }

    function checkChanges(changes) {
        if (changes) {
            throw new Error('Cannot initialize when there are unstaged changes');
        }
    }

    function heading(text) {
        var start, end;
        if (text.length < HEADING_LENGTH) {
            start = Math.floor((HEADING_LENGTH - text.length) / 2);
            end = Math.ceil((HEADING_LENGTH - text.length) / 2);
            start = Array(start)
                .fill('-')
                .join('');
            end = Array(end)
                .fill('-')
                .join('');
            text = `${start}${text}${end}`;
        }
        const breaker = Array(text.length)
            .fill('-')
            .join('');
        console.info(breaker);
        console.info(text);
        console.info(breaker);
    }

    /** Loads the existing package.json or creates a new one if none exists */
    function loadPackageJson(appRoot) {
        const packagePath = path.join(appRoot, 'package.json');
        console.trace(`loadPackageJson("${packagePath}")`);
        return sys.read(packagePath)
            .then(function onFileRead(data) {
                if (data) {
                    destPackage = JSON.parse(data);
                    // Not created
                    return false;
                } else {
                    return createPackageJson(appRoot).then(() => true);
                }
            });
    }

    /** Adds scripts and dev dependencies to the consuming projects package.json */
    function updatePackageJson(appRoot, created) {
        console.trace(`updatePackageJson(${JSON.stringify(created)})`);
        destPackage.scripts = destPackage.scripts || {};

        return add('scripts', 'test', 'grunt test')
            .then(() => add('scripts', 'quality', 'grunt quality'))
            .then(() => add('scripts', 'cover', 'grunt cover'))
            .then(() => add('scripts', 'precommit', 'npm test'))
            .then(() => add('scripts', 'prepush', 'npm test'))
            .then(() => updateBump())
            .then(() => copyDeps())
            .then(() => updateValues());

        function updateBump() {
            const val = local ?
                './scripts/bump.js' :
                './node_modules/.bin/bump';
            return add('scripts', 'bump', val);
        }

        function updateValues() {
            if (created) {
                // We only update if we haven't just created
                return undefined;
            } else {
                return question('Enter the name of the package', destPackage.name)
                    .then(answer => destPackage.name = answer)
                    .then(() => question('Enter the initial version', destPackage.version, VERSION_MATCH))
                    .then(answer => destPackage.version = answer)
                    .then(() => noneRegexQuestion(
                        'Enter the minumum node version',
                        previousMajor(destPackage.engines && destPackage.engines.node || process.version.slice(1)),
                        FREE_VERSION_MATCH)
                    )
                    .then(ensureEngines)
                    .then(answer => destPackage.engines.node = `${answer}`)
                    .then(() => noneRegexQuestion(
                        'Enter the minumum NPM version',
                        previousMajor(destPackage.engines && destPackage.engines.npm || npmMod.version),
                        FREE_VERSION_MATCH)
                    )
                    .then(ensureEngines)
                    .then(answer => destPackage.engines.npm = `${answer}`)
                    .then(() => question('Enter the license type', destPackage.license))
                    .then(answer => destPackage.license = answer)
                    .then(() => question('Enter a description for the package', destPackage.description))
                    .then(answer => destPackage.description = answer)
                    .then(() => question('Entry point', destPackage.main))
                    .then(answer => destPackage.main = answer)
                    .then(() => getAuthorDetails())
                    .then(details => destPackage.author = details, destPackage.author)
                    .then(() => git.origin(appRoot), ans => !ans || URI_MATCH.exec(ans))
                    .then(orig => question('Git repository', orig || destPackage.repository && destPackage.repository.url))
                    .then(answer => destPackage.repository = answer ? { type: 'git', url: answer } : undefined)
                    .then(() => question('Keywords', destPackage.keywords))
                    .then(answer => destPackage.keywords = answer, destPackage.keywords);
            }
        }

        /** Copies each dev dependency, asking to replace if necessary */
        function copyDeps() {
            if (!local) {
                destPackage.devDependencies = destPackage.devDependencies || {};
                const deps = sourcePackage.devDependencies;
                Object.keys(deps).forEach(dep => add('devDependencies', dep, deps[dep]));
            }
        }

        /** Adds a new item to the supplied type asking to replace if necessary */
        function add(type, name, value) {
            if (destPackage[type].hasOwnProperty(name) && destPackage[type][name] !== value) {
                const txt = `Would you like to replace ${type}.${name} ("${destPackage[type][name]}") with "${value}"`;
                return question(txt, 'n', ['y', 'n'])
                    .then(ans => ans.toLowerCase() === 'y' && (destPackage[type][name] = value));
            } else {
                destPackage[type][name] = value;
                return Promise.resolve();
            }
        }
    }

    /** Updates the package.json */
    function savePackageJson(appRoot) {
        console.trace('savePackageJson()');
        if (argv.nowrite) {
            console.error('Would have written package.json');
            return undefined;
        } else {
            const packagePath = path.join(appRoot, 'package.json');
            const text = JSON.stringify(destPackage, null, PACKAGE_SPACE);
            return sys.write(packagePath, `${text}\n`);
        }
    }

    /** Prepares the main package git repo and initializes git flow */
    function gitPrep(appRoot) {
        console.trace('gitPrep()');
        // eslint-disable-next-line consistent-return
        return git.installed(appRoot)
            .then(gitInit)
            .then(() => git.flowInstalled(appRoot))
            .then(gitFlowInit);

        function gitInit(installed) {
            if (installed) {
                if (argv.nowrite) {
                    console.error('Would have initialized GIT repository');
                    return undefined;
                } else {
                    ask.end(); // Make sure we won't interfere with stdin
                    return git.initialize(appRoot);
                }
            } else {
                console.warn('Git is not installed. Skipping git preperation.');
                return undefined;
            }
        }

        // eslint-disable-next-line consistent-return
        function gitFlowInit(installed) {
            if (installed) {
                if (argv.nowrite) {
                    console.error('Would have initialized GIT flow');
                } else {
                    ask.end(); // Make sure we won't interfere with stdin
                    return git.initializeFlow(appRoot, argv.silent);
                }
            } else {
                console.warn('Git flow is not installed. Skipping git flow preperation.');
            }
        }
    }

    /** Creates a new package.json in the consumer and adds this library as a dependencies */
    function createPackageJson(appRoot) {
        console.trace('createPackageJson()');
        const deps = {};
        deps[sourcePackage.name] = sourcePackage.version;
        destPackage = { dependencies: deps };

        return question('Enter the name of the package', path.basename(appRoot))
            .then(answer => destPackage.name = answer)
            .then(() => question('Enter the initial version', VERSION, VERSION_MATCH))
            .then(answer => destPackage.version = answer)
            .then(() => noneRegexQuestion('Enter the minumum node version',
                previousMajor(process.version.slice(1)),
                VERSION_MATCH))
            .then(ensureEngines)
            .then(answer => answer && (destPackage.engines.node = `>=${answer}`))
            .then(() => noneRegexQuestion('Enter the minumum NPM version', previousMajor(npmMod.version), VERSION_MATCH))
            .then(ensureEngines)
            .then(answer => answer && (destPackage.engines.npm = `>=${answer}`))
            .then(() => question('Enter the license type', LICENSE))
            .then(answer => destPackage.license = answer)
            .then(() => question('Enter a description for the package'))
            .then(answer => destPackage.description = answer)
            .then(() => question('Entry point', ENTRY))
            .then(answer => destPackage.main = answer)
            .then(() => getAuthorDetails())
            .then(details => destPackage.author = details)
            .then(() => git.origin(appRoot), ans => !ans || URI_MATCH.exec(ans))
            .then(origin => question('Git repository', origin))
            .then(answer => destPackage.repository = answer ? { type: 'git', url: answer } : undefined)
            .then(() => question('Keywords'))
            .then(answer => destPackage.keywords = answer);
    }

    /** Get's author details */
    function getAuthorDetails() {
        return npm.author()
            .then(details => ensureData(details, 'name', 'Enter your name'))
            .then(details => ensureData(details, 'email', 'Enter your email', EMAIL_MATCH))
            .then(details => `${details.name} <${details.email}>`);

        /** Ensures the supplied data is available on the object */
        function ensureData(data, name, question, check) {
            if (data[name]) {
                // Note: we return data for chaining
                return data;
            } else {
                return question(question, undefined, check)
                    .then(ans => data[name] = ans)
                    // Note: we return data for chaining
                    .then(() => data);
            }
        }
    }

    function ensureEngines(answer) {
        if (answer && answer !== NONE) {
            destPackage.engines = destPackage.engines || {};
        }
        return answer;
    }

    /**
     * Generates contents using a dynamic module, and writes them to the
     *   supplied destination (relative to the consuming project)
     */
    function dynamic(appRoot, name, dest, check) {
        console.trace(`dynamic(${JSON.stringify(name)}, ${JSON.stringify(dest)}, ${JSON.stringify(check)})`);
        const odest = dest;
        dest = path.join(appRoot, dest);
        if (check) {
            return sys.exists(dest)
                .then(checkExists)
                .then(ans => ans && ans.toLowerCase() === 'y' && doProcess());
        } else {
            return doProcess();
        }

        function checkExists(exists) {
            if (exists) {
                console.trace(`Dynamic file "${dest}" already exists`);
                return question(`File "${odest}" already exists. Would you like to overwrite (y/n)?`, 'n');
            } else {
                console.trace(`Dynamic file "${dest}" does not exist`);
                return 'y';
            }
        }

        /** Processes the dynamic module */
        function doProcess() {
            console.trace(`Processing dynamic module "${name}"`);
            const dynMod = require(`../dynamic/${name}.js`);
            const content = dynMod({
                root: appRoot
            });
            if (content instanceof Promise) {
                return content.then(onGotContent);
            } else {
                return onGotContent(content);
            }
            function onGotContent(content) {
                if (argv.nowrite) {
                    console.error(`Would have written dynamic file "${dest}"`);
                    return undefined;
                } else {
                    console.trace(`Writing ${Buffer.byteLength(content)} to "${dest}"`);
                    return sys.write(dest, content);
                }
            }
        }
    }

    /**
     * Links or copies a file depending on the options passed to the script.
     * @param {string} src The location of the source file (This is relative to this project).
     * @param {string} dest The location of the destination file (This is relative to the consuming project).
     * @param {boolean} check Whether to check overwrite when copying
     */
    function fileLink(appRoot, src, dest, check) {
        console.trace(`fileLink(${JSON.stringify(src)}, ${JSON.stringify(dest)}})`);
        if (argv._.includes(LINK_ARG)) {
            return ln(appRoot, src, dest);
        } else {
            return copy(appRoot, src, dest, check);
        }
    }

    /** Resolves the target to the application root and creates the directory */
    function mkdir(appRoot, target) {
        console.trace(`mkdir(${JSON.stringify(target)})`);
        return sys.mkdir(path.join(appRoot, target));
    }

    /** Resolves the src and dest to the application root and copies the file */
    function copy(appRoot, src, dest, check) {
        console.trace(`copy(${JSON.stringify(src)}, ${JSON.stringify(dest)}, ${JSON.stringify(check)})`);
        const odest = dest;
        src = path.join(__dirname, '..', src);
        dest = path.join(appRoot, dest);

        if (check) {
            return sys.exists(dest).then(function onCheckedExists(exists) {
                if (exists) {
                    return question(`File "${odest}" already exists. Would you like to overwrite`, 'n', ['y', 'n'])
                        .then(ans => ans === 'y' && doCopy());
                } else {
                    return doCopy();
                }
            });
        } else {
            return doCopy();
        }

        function doCopy() {
            if (argv.nowrite) {
                console.error(`Would have copied "${src}" to "${dest}"`);
                return undefined;
            } else {
                return sys.copy(src, dest);
            }
        }
    }

    /** Creates keep files in the given directory if there are no other files so that they are preserved by source control */
    function keep(appRoot, directory) {
        directory = path.join(appRoot, directory);
        return new Promise(function promiseHandler(resolve, reject) {
            fs.readdir(directory, function onDirRead(err, files) {
                if (err) {
                    reject(err);
                } else if (files.length) {
                    resolve();
                } else {
                    const file = path.join(directory, '.keep');
                    fs.writeFile(file, '', function onFileWritten(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                }
            });
        });
    }

    /** Resolves the src and dest to the application root and links the file */
    function ln(appRoot, src, dest) {
        console.trace(`ln(${JSON.stringify(src)}, ${JSON.stringify(dest)})`);
        if (argv.nowrite) {
            console.error(`Would have linked "${src}" to "${dest}"`);
            return undefined;
        } else {
            src = path.join(__dirname, '..', src);
            dest = path.join(appRoot, dest);
            return sys.ln(src, dest);
        }
    }

    function npmInstall(appRoot) {
        if (argv.nowrite) {
            console.error('Would have run "npm install"');
            return undefined;
        } else {
            return npm.install(appRoot);
        }
    }

    /** Asks a question if silent mode is not on */
    function question(txt, def, options) {
        console.trace(`question(${JSON.stringify(txt)}, ${JSON.stringify(def)}, ${JSON.stringify(options)})`);
        if (argv.silent) {
            return Promise.resolve(def || options && options[0] || '');
        } else {
            return ask(txt, def, options);
        }
    }

    function previousMajor(version) {
        if (version) {
            const parts = version.split('.');
            if (parts.length === VERSION_PART_COUNT) {
                if (parseInt(parts[0], 10) > 0) {
                    return [parts[0], '0', '0'].join('.');
                }
            }
            return version;
        } else {
            return version;
        }
    }

    function noneRegexQuestion(txt, def, options) {
        txt = `${txt} (enter "${NONE}" for none)`;
        return question(txt, def, function onAnswered(ans) {
            if (ans !== NONE && !options.exec(ans)) {
                throw new Error(`Invalid answer ${ans}`);
            }
            return ans;
        });
    }

    function noop() {
        // Used to optimise empty functions
    }
}
