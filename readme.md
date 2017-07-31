# TODO
* Add checks for require usage (file / directory exists... file always uses name with extension)
* Make sure we are not leaving a modified package.json

# Base library
A boilerplate project for starting other projects, and keeping them up to date.

* [Getting Started](#getting-started)
* [Updating](#updating)
* [Environment](#environment)
    * [Files](#files)
* [GIT](#git)
* [Log wrap](#log-wrap)
    * [Options](#options)
    * [Structure](#structure)
* [Grunt Base](#grunt-base)
    * [Default Modules](#default-modules)
    * [Default Tasks](#default-tasks)
    * [Extending](#extending)
* [Scripts](#scripts)
    * [prepare-environment](#prepare-environment)
    * [bump](#bump)
* [Testing and Quality Control](#testing-and-quality-control)
    * [Testing Helper](#testing-helper)
    * [Mocks](#mocks)
        * [console](#console)
        * [Date](#date)
        * [Error](#error)
        * [setTimeout](#setTimeout)
        * [setInterval](#setInterval)

## Getting started
The following steps will end with a new project with a directory structure initialized, grunt pipelines for testing and
quality control.

1. `mkdir my-new-proj`
1. `cd my-new-proj`
1. `npm install ssh+git@github.com:major-mann/base-lib.git`
1. `./node_modules/.bin/prepare-environment`

## Updating
In order to update the `base-lib` in a project simply run `./node_modules/.bin/prepare-environment` and follow the prompts.
This will ask before overwriting any value or replacing any file.

## Environment
The `prepare-environment` script will prepare a general file structure that supports a common repository and testing
framework with some utility scripts for version updates.

### Files
The following structure is prepared by the `prepare-environment` script.

* `src` The directory containing the primary source code of the application
* `test` The directory containing the tests for the library
* `.eslintrc` An eslint configuration pointing to the common configuration stored in the base library
* `gruntfile.js` A gruntfile referencing the common gruntfile defined in the base library
* `.nvmrc` An NVM configuration with the appropriate version of node
* `.gitignore` gitignore configuration
* `.eslintignore` Files to ignore when linting
* `.editorconfig` Hints for editors regarding project formatting
* `.istanbul.yml` Configuration for istanbul code coverage
* `test/.editorconfig` Editor configuration specific for tests
* `test/.eslintrc` Linting configuration specifically for tests
* `package.json` Prepared by the preparation script to include sane values

## GIT
The preparation script will initialize both GIT and GIT Flow and commit all changes as "Initial commit". The `husky` module
will add pre-commit and pre-push hooks to run `npm test`.

## Log wrap
The log wrap attempts to normalize a given logging object. At a minumum the supplied logging object needs to have one of the
standard logging functions (`error`, `warn`, `info`, `verbose`, `debug`, `silly`). The resulting object will have all the
previous functions as well as a `stat` object containing functions: `increment`, `decrement`, `histogram`, `gauge`, `unique`,
`set`. This will be `noop` (will execute callback if provided) functions unless `options.stat` (A stat provider with
the same functions) is provided, in which case they will pass through to that. The wrapped log object will have the
originally supplied log object as a prototype and so all properties will be available. In addition, if the supplied log
value is a function, the result will be a function which proxies through to the original.

### Options
The following options are available when wrapping the logger:

* `tags` An array of tags which will be prefixed to the front of every log. Attached to the final log object as "tags".
* `stat` A stat provider. When supplied it will be validated to ensure the required functions exist on the provider.
* `levelCheck` A function which will be called when checking whether a log should be done or skipped. Expected
    signature is levelCheck(level, log)
* `callLocation` true to add the call location. If a string is supplied, it will be used as a match to trim a prefix
    off of all stack lines.
* `timestamp` Truthy to add a timstamp to the prefix. If a string is supplied it will be used to format the
    date (using moment)
* `projectRoot` A custom location to use to strip the project root from call tracing.

### Structure
The resulting log object will have the following structure.

* `error(msg, ...formatParams)` Logs an error
* `warn(msg, ...formatParams)` Logs a warning
* `info(msg, ...formatParams)` Provides an informational log
* `verbose(msg, ...formatParams)` Provides a detailed informational log
* `debug(msg, ...formatParams)` Provides a log to assist with debugging code
* `silly(msg, ...formatParams)` Provides a log that can be used for tracing and informational purposes
* `levels` An object containing level names and their severities (lower number means higher severity)
* `level` A property to get or set the current log level
* `tags` An array of items to be prepended (as strings) to any log messages. The call location and timestamp will be added
    to the front of this array if specified by the options.
* `stat` An object containing the stats functions
    * `increment(name, [count], [sampleRate], [tags], [callback])`
    * `decrement(name, [count], [sampleRate], [tags], [callback])`
    * `histogram(name, [count], [sampleRate], [tags], [callback])`
    * `gauge(name, [count], [sampleRate], [tags], [callback])`
    * `unique(name, [count], [sampleRate], [tags], [callback])`
    * `set(name, [count], [sampleRate], [tags], [callback])`

## Grunt base
The grunt base is used to provide common quality control grunt structures in such a way that they can easily be extended.

### Default modules

* `grunt-mocha-test` Used to run test suites
* `grunt-eslint` Used to perform static code quality analysis
* `grunt-shell` Used to run istanbul
* `grunt-complexity` Used to check code complexity
* `grunt-jscpd` Used to ensure there are no copy pasted blocks
* `grunt-jsonlint` Used to check JSON formatting is appropriate
* `grunt-filenames` Used to ensure filenames use kebab naming

### Default tasks

* `eslint` Checks all JS files in the project for linting compliance
* `jscpd:src` Checks all JS files in the project src directory for copy pasting
* `jscpd:spec` Checks all JS files in the project spec directory for copy pasting
* `jsonlint` Checks all json files in the project for compliance
* `mochaTest:spec` Runs all tests in the test directory
* `mochaTest:single` Runs a single test specified by the `--target` option
* `shell:cover` Runs istanbul coverage on the test command
* `filenames` Checks all filenames use kebab naming
* `test` Runs the `quality` and `mochatest:spec` commands
* `cover` Runs the `shell:cover` command
* `quality` Runs the `filenames`, `eslint`, `jscpd`, and `jsonlint` commands
* `default` Runs the `test` and `cover` commands

### Extending
In order to extend use `gruntfile.js` to define the extensions. There are 3 parameters.

* Parameter 1 is additional grunt modules to load
* Parameter 2 is config to add for the modules
* Parameter 3 is an array of arrays representing defined commands. Each sub array represents the command name followed by
the sub commands to execute.

Example

    const grunt = require('./src/grunt.js');
    module.exports = grunt(['some-grunt-module'], {
        someGruntModule: {
            comm1: {
                src: ['foo.js']
            },
            comm2 {
                src: ['bar.js']
            }
        }
    }, ['mycommand', 'someGruntModule:comm1', 'someGruntModule:comm2']);

## Scripts

### prepare-environment
The prepare environment generates and copies (optionally symlinks where appropriate) all files
required for the current environment. This includes initializing `package.json` with sane values. If target files already
exist, the consumer will be asked whether to overwrite / update various values throughout the process. The following is
the output of `prepare-environment --help`:

    Usage: prepare-environment [options] [ln]
        ln Link files instead of copying where appropriate
        --silent Use all defaults
        --nowrite Do everything except persist changes
        --v Verbose
        --vv More verbose

### bump
Increments the version number in `package.json`, creates a tag in git with the version number, and commits everything.
The following is the output of `bump --help`:

    Usage: bump [options]
        --revision [Default] Bumps the version revision
        --minor Bumps the minor version number
        --major Bumps the major version number
        --verbose Enables verbose logging output

## Testing and Quality control
The preparation script will add an `npm test` command which will perform quality checks then tests. In order to directly
access the tests the following grunt commands may be used.

* `grunt mochaTest:spec` Runs all `*.spec.js` files in the test directory
* `grunt mochaTest:single --target=<spec file>` Runs a single spec file
* `grunt cover` Performs coverage using mocaTest:spec
* `grunt quality` Runs various linters and code quality checks on the code

I addition to this [husky](https://github.com/typicode/husky) is part of the dependencies to ensure tests are run on commit
and before pushing.

### Testing Helper
The testing helper prepares the testing environment by exposing `chai`, `expect`, `mockery` and the mocks (`mock`) globally.
It adds `chai-spies` and `chai-as-promised` middleware to mocha. Finally is registers hooks before each test to enable
`mockery` and after each to clear the require cache, deregister all mocks and reset the globals back to their original
values. The following globals will be restored:

* `Error`
* `setTimeout`
* `clearTimeout`
* `setInterval`
* `clearInterval`
* `Date`
    * `now`
* `console`
    * `log`
    * `info`
    * `warn`
    * `error`
    * `dir`
    * `time`
    * `timeEnd`
    * `trace`
    * `assert`

### Mocks
The following mocks are provided for tests (through `global.mock`). All mock modules are exposed as a function to create
a new mock.

#### Console
A mock which wraps console with spy functions and allows output to be turned on or off. Console has the following structure:

* `$output([output])` Returns whether output to actual console is enabled, if a value is supplied, output will be updated.
* A spy for the `log` function. If output is enabled, this will be forwarded to `console.log`.
* A spy for the `info` function. If output is enabled, this will be forwarded to `console.info`.
* A spy for the `warn` function. If output is enabled, this will be forwarded to `console.warn`.
* A spy for the `error` function. If output is enabled, this will be forwarded to `console.error`.
* A spy for the `dir` function. If output is enabled, this will be forwarded to `console.dir`.
* A spy for the `time` function. If output is enabled, this will be forwarded to `console.time`.
* A spy for the `timeEnd` function. If output is enabled, this will be forwarded to `console.timeEnd`.
* A spy for the `trace` function. If output is enabled, this will be forwarded to `console.trace`.
* A spy for the `assert` function. If output is enabled, this will be forwarded to `console.assert`.

Example

    const mock = mocks.console();
    mock.info('foo');
    // output: "foo"
    mock.$output(false);
    mock.info('bar');
    mock.$output(true);
    mock.info('baz');
    // output: "baz"


#### Date
A mock for date which allows the time to be locked and which allows an offset to be set.

* `$lockTime([number])` Returns the currently locked time, or `undefined` if the time is not locked. If a number is supplied,
the current time is locked to that.
* `$offsetTime([number])` Returns the current time offset. If a number is supplied, the offset time will be set to that.

Example

    const MockDate = mocks.date();
    MockDate.$offsetTime(1000);
    MockDate.$lockTime(0);
    MockDate.now();
    // outputs: 1000
    MockDate.$lockTime(false);
    MockDate.now();
    // outputs: Date.now() + 1000

#### Error
A mock for `Error` which allows a custom stack to be set and reset. By passing a type to `createMock` the base class for the
mock (so that, for example, TypeError can be mocked). The resulting mocked errors will have  prototypes matching the supplied
classes.

* `$setStack([stack])` Returns the current stack. If a `stack` argument is supplied, the original stack will be replaced
with this. If a falsy value is supplied, the stack will be reset to the original.

#### Interval
Provides a mock for `setInterval` that allows time to be "fast forwarded" to simulate waiting for execution to happen.

* `$flush(time)` Moves the timer forward `time` milliseconds (executing handlers as many times as they would have been if
the time had been waiting for).
* `$clear()` Removes all intervals created with the mock.

#### Timeout
Provides a timeout function that allows listeners to be flushed and can throw an error when there are handlers left over.

* `$flush([delay])` Flushes any handlers registered with the timeout. Optionally will wait `delay` ms before executing the
handlers.
* `$verifyNoPendingTasks()` Throws an error if there are any outstanding handlers registered.















-
