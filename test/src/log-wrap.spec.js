describe('Log wrap', function () {
    var logWrap, log;
    beforeEach(function () {
        logWrap = require('../../src/log-wrap.js');
        log = {
            silly: chai.spy(),
            debug: chai.spy(),
            verbose: chai.spy(),
            info: chai.spy(),
            warn: chai.spy(),
            error: chai.spy()
        };
    });

    it('should be a function', function () {
        expect(logWrap).to.be.a('function');
    });
    it('should have a property named "LEVELS" which are the level names to create new loggers with', function () {
        expect(logWrap.LEVELS).to.be.an('array');
    });

    it('should ensure "log" is an object or function', function () {
        expect(() => logWrap(123)).to.throw(/log.*function.*object/i);
        expect(() => logWrap('hello world')).to.throw(/log.*function.*object/i);
        expect(() => logWrap(true)).to.throw(/log.*function.*object/i);
        expect(() => logWrap(null)).to.throw(/log.*function.*object/i);
        expect(() => logWrap()).to.throw(/log.*function.*object/i);
    });
    it('should not re-wrap an existing log', function () {
        const res1 = logWrap(log);
        const res2 = logWrap(res1);
        expect(res1).not.to.equal(log);
        expect(res1).to.equal(res2);
    });
    it('should attempt to retrieve initial level from underlying log', function () {
        const level = 'warn';
        const res1 = logWrap(log);
        log.level = level;
        const res2 = logWrap(log);

        expect(res1.level).to.equal(logWrap.DEFAULT_LEVEL);
        expect(res2.level).to.equal(level);
    });
    it('should set the base log level when setting log level if the base originally had one', function () {
        log.level = 'info';
        const res1 = logWrap(log);
        res1.level = 'warn';
        expect(log.level).to.equal('warn');
    });
    it('should reject an object without at least 1 of the log levels as a function', function () {
        expect(() => logWrap({})).to.throw(/no.*valid.*levels/i);
    });

    describe('options checks', function () {
        it('should ensure options is an object or function when supplied', function () {
            expect(() => logWrap(log, 123)).to.throw(/options.*object/i);
            expect(() => logWrap(log, 'foo bar baz')).to.throw(/options.*object/i);
            expect(() => logWrap(log, {})).not.to.throw();
            expect(() => logWrap(log, () => true)).not.to.throw();
        });
        it('should ensure options.levelCheck is a function when supplied', function () {
            expect(() => logWrap(log, { levelCheck: 'foo' })).to.throw(/options\.levelCheck.*function/i);
            expect(() => logWrap(log, { levelCheck: () => true })).not.to.throw();
        });
        it('should ensure stat is an object or function when supplied', function () {
            expect(() => logWrap(log, { stat: 'foo' })).to.throw(/stat.*function.*object/i);
            expect(() => logWrap(log, { stat: true })).to.throw(/stat.*function.*object/i);
            expect(() => logWrap(log, { stat: 123 })).to.throw(/stat.*function.*object/i);
            expect(() => logWrap(log, { stat: undefined })).not.to.throw();
        });
        it('should ensure stat.increment is a function when supplied', function () {
            var stat;
            stat = { increment: 123 };
            expect(() => logWrap(log, { stat })).to.throw(/increment.*function/i);
            stat = { increment: 'foo bar baz' };
            expect(() => logWrap(log, { stat })).to.throw(/increment.*function/i);
            stat = { increment: () => true };
            expect(() => logWrap(log, { stat })).not.to.throw();
        });
        it('should ensure stat.decrement is a function when supplied', function () {
            var stat;
            stat = { decrement: 123 };
            expect(() => logWrap(log, { stat })).to.throw(/decrement.*function/i);
            stat = { decrement: 'foo bar baz' };
            expect(() => logWrap(log, { stat })).to.throw(/decrement.*function/i);
            stat = { decrement: () => true };
            expect(() => logWrap(log, { stat })).not.to.throw();
        });
        it('should ensure stat.histogram is a function when supplied', function () {
            var stat;
            stat = { histogram: 123 };
            expect(() => logWrap(log, { stat })).to.throw(/histogram.*function/i);
            stat = { histogram: 'foo bar baz' };
            expect(() => logWrap(log, { stat })).to.throw(/histogram.*function/i);
            stat = { histogram: () => true };
            expect(() => logWrap(log, { stat })).not.to.throw();
        });
        it('should ensure stat.gauge is a function when supplied', function () {
            var stat;
            stat = { gauge: 123 };
            expect(() => logWrap(log, { stat })).to.throw(/gauge.*function/i);
            stat = { gauge: 'foo bar baz' };
            expect(() => logWrap(log, { stat })).to.throw(/gauge.*function/i);
            stat = { gauge: () => true };
            expect(() => logWrap(log, { stat })).not.to.throw();
        });
        it('should ensure stat.timing is a function when supplied', function () {
            var stat;
            stat = { timing: 123 };
            expect(() => logWrap(log, { stat })).to.throw(/timing.*function/i);
            stat = { timing: 'foo bar baz' };
            expect(() => logWrap(log, { stat })).to.throw(/timing.*function/i);
            stat = { timing: () => true };
            expect(() => logWrap(log, { stat })).not.to.throw();
        });
        it('should ensure stat.set is a function when supplied', function () {
            var stat;
            stat = { set: 123 };
            expect(() => logWrap(log, { stat })).to.throw(/set.*function/i);
            stat = { set: 'foo bar baz' };
            expect(() => logWrap(log, { stat })).to.throw(/set.*function/i);
            stat = { set: () => true };
            expect(() => logWrap(log, { stat })).not.to.throw();
        });
        it('should ensure stat.unique is a function when supplied', function () {
            var stat;
            stat = { unique: 123 };
            expect(() => logWrap(log, { stat })).to.throw(/unique.*function/i);
            stat = { unique: 'foo bar baz' };
            expect(() => logWrap(log, { stat })).to.throw(/unique.*function/i);
            stat = { unique: () => true };
            expect(() => logWrap(log, { stat })).not.to.throw();
        });
    });

    describe('function log', function () {
        var log;
        beforeEach(function () {
            log = chai.spy();
            log.error = chai.spy();
        });

        it('should return a function', function () {
            expect(logWrap(log)).to.be.a('function');
        });
        it('should return a new proxy function to the supplied function', function () {
            const proxy = logWrap(log);
            expect(proxy).not.to.equal(log);
            proxy();
            expect(log).to.have.been.called.exactly(1);
        });
        it('should have the original function as a prototype', function () {
            const proxy = logWrap(log);
            expect(Object.getPrototypeOf(proxy)).to.equal(log);
        });
    });

    describe('object log', function () {
        it('should return an object', function () {
            const res = logWrap(log);
            expect(res).to.be.an('object');
        });
        it('should return an object with a prototype of "log"', function () {
            const res = logWrap(log);
            expect(Object.getPrototypeOf(res)).to.equal(log);
        });
    });

    describe('meta properties', function () {
        var options;
        beforeEach(function () {
            options = {
                id: 'foo bar baz',
                tags: ['foo', 'bar', 'baz']
            };
            log = logWrap(log, options);
        });
        it('should have a property called "levels" which is an object with level names and their severity indexes', function () {
            expect(log.levels).to.be.an('object');
            expect(log.levels.error).to.equal(0);
            expect(log.levels.warn).to.equal(1);
            expect(log.levels.info).to.equal(2);
            expect(log.levels.verbose).to.equal(3);
            expect(log.levels.debug).to.equal(4);
            expect(log.levels.silly).to.equal(5);
        });
        it('should have a property named "level" which is a string representing the current level', function () {
            expect(log.level).to.equal(logWrap.DEFAULT_LEVEL);
        });
        it('should only allow valid levels to be set', function () {
            expect(() => log.level = 123).to.throw(/invalid/i);
            expect(() => log.level = true).to.throw(/invalid/i);
            expect(() => log.level = 'foo bar baz').to.throw(/invalid/i);
            expect(() => log.level = '').to.throw(/invalid/i);
            expect(() => log.level = 'error').not.to.throw();
        });
        it('should have an array called tags which contains the tags to use', function () {
            expect(log.tags).to.be.an('array');
            expect(log.tags[0]).to.equal('foo');
            expect(log.tags[1]).to.equal('bar');
            expect(log.tags[2]).to.equal('baz');
        });
    });

    describe('levels', function () {
        var baseLog, errArgs;
        beforeEach(function () {
            const opts = {};
            baseLog = {
                error: chai.spy(function () {
                    errArgs = [...arguments];
                }),
                verbose: chai.spy()
            };
            log = logWrap(baseLog, opts);
            log.level = 'silly';
        });
        it('should have a "silly" function', function () {
            expect(log.silly).to.be.a('function');
        });
        it('should have a "debug" function', function () {
            expect(log.debug).to.be.a('function');
        });
        it('should have a "verbose" function', function () {
            expect(log.verbose).to.be.a('function');
        });
        it('should have a "info" function', function () {
            expect(log.info).to.be.a('function');
        });
        it('should have a "warn" function', function () {
            expect(log.warn).to.be.a('function');
        });
        it('should have a "error" function', function () {
            expect(log.error).to.be.a('function');
        });
        it('should map to the nearest available function', function () {
            log.error('foo');
            expect(baseLog.error).to.have.been.called.exactly(1);
            log.warn('foo');
            expect(baseLog.error).to.have.been.called.exactly(2);
            log.info('foo');
            expect(baseLog.error).to.have.been.called.exactly(3);

            log.verbose('foo');
            expect(baseLog.verbose).to.have.been.called.exactly(1);
            log.debug('foo');
            expect(baseLog.verbose).to.have.been.called.exactly(2);
            log.silly('foo');
            expect(baseLog.verbose).to.have.been.called.exactly(3);

            expect(baseLog.verbose).to.have.been.called.exactly(3);
            expect(baseLog.error).to.have.been.called.exactly(3);
        });
        it('should allow a single function to be passed in that can be called to retrieve the arguments', function () {
            log.error(() => ['foo', 'bar', 'baz']);
            expect(errArgs).to.be.an('array');
            expect(errArgs.length).to.equal(3);
            expect(errArgs[0]).to.equal('foo');
            expect(errArgs[1]).to.equal('bar');
            expect(errArgs[2]).to.equal('baz');
        });
        it('should allow a both an array or a single value to be returned', function () {
            log.error(() => 'hello world');
            expect(errArgs).to.be.an('array');
            expect(errArgs.length).to.equal(1);
            expect(errArgs[0]).to.equal('hello world');
        });
        it('should not pass through to the base logger if the current level is too low', function () {
            log.level = 'error';
            log.error('foo bar baz');
            log.verbose('foo bar baz');
            expect(baseLog.error).to.have.been.called.exactly(1);
            expect(baseLog.verbose).to.have.been.called.exactly(0);
        });
        it('should prefix the given message with the tags', function () {
            log.tags.push('foo');
            log.tags.push('bar');
            log.tags.push('baz');

            log.error('hello world');
            expect(errArgs).to.be.an('array');
            expect(errArgs.length).to.equal(1);
            expect(errArgs[0]).to.match(/\[foo\]\[bar\]\[baz\]hello world/i);
        });
        it('should add a timestamp to the prefix if the options.timestamp is truthy', function () {
            const log = logWrap(baseLog, { timestamp: true });
            log.error('foo bar baz');
            const date = (new Date())
                .toISOString()
                .substr(0, 19);
            expect(errArgs[0]).to.match(new RegExp(`${date}.*foo bar baz`));
        });
        it('should use the supplied value as a timestamp format if options.timestamp is a string', function () {
            const log = logWrap(baseLog, { timestamp: 'YYYY-MM-DD' });
            log.error('foo bar baz');
            const date1 = (new Date())
                .toISOString()
                .substr(0, 19);
            const date2 = date1.substr(0, 10);
            expect(errArgs[0]).not.to.match(new RegExp(`${date1}.*foo bar baz`));
            expect(errArgs[0]).to.match(new RegExp(`${date2}.*foo bar baz`));
        });
        it('should add the call location to the prefix if options.callLocation is truthy', function () {
            const log = logWrap(baseLog, { callLocation: true });
            log.error('foo bar baz');
            expect(errArgs[0]).to.match(new RegExp(`\\[test/src/log-wrap\\.spec\\.js:\\d+.*\\].*foo bar baz`, 'i'));
        });

        it('should put the first project (non module) location in brackets', function () {
            const fakeStack = new Error().stack.split('\n');
            global.Error = function (message) {
                const fs = fakeStack.slice();
                fs.splice(1, 0, 'at fake.location (/some/place/node_modules/fake.js:36:78)');
                return {
                    message,
                    stack: fs.join('\n')
                };
            };
            const log = logWrap(baseLog, { callLocation: true });
            log.error('foo bar baz');
            const check = new RegExp(`\\[/some/place/node_modules/fake.js:36:78.*\\(test/src/log-wrap.spec.js:\\d+.*\\).*\\].*` +
                `foo bar baz`, 'i');
            expect(errArgs[0]).to.match(check);
        });

        it('should allow a custom prefix to be trimmed from stack entries if options.callLocation is a string', function () {
            const log = logWrap(baseLog, { callLocation: `/${__dirname.split('/')[1]}/` });
            const expected = __filename
                .split('/')
                .slice(2)
                .join('/');
            log.error('foo bar baz');
            expect(errArgs[0]).to.match(new RegExp(`\\[${expected}:\\d+.*\\].*foo bar baz`, 'i'));
        });
        it('should handle a non string first argument', function () {
            log.tags.push('foo');
            log.tags.push('bar');
            log.tags.push('baz');

            log.error();
            expect(errArgs).to.be.an('array');
            expect(errArgs.length).to.equal(1);
            expect(errArgs[0]).to.match(/\[foo\]\[bar\]\[baz\]undefined/i);
        });
        it('should call the check function if one was supplied', function () {
            var lc = chai.spy(() => false);
            log = logWrap(baseLog, { levelCheck: lc });
            log.level = 'error';
            log.error('foo bar baz');
            log.verbose('foo bar baz');
            expect(lc).to.have.been.called.exactly(1);
            expect(baseLog.error).to.have.been.called.exactly(0);
            expect(baseLog.verbose).to.have.been.called.exactly(0);
        });
    });

    describe('stat', function () {
        var wrapped, statProvider;
        beforeEach(function () {
            statProvider = {
                increment: chai.spy(),
                decrement: chai.spy(),
                histogram: chai.spy(),
                gauge: chai.spy(),
                unique: chai.spy(),
                set: chai.spy(),
                timing: chai.spy()
            };
            wrapped = logWrap(log, { stat: statProvider });
        });

        it('should be an object', function () {
            expect(wrapped.stat).to.be.an('object');
        });
        it('should provide noop functions when no stat provider is defined', function () {
            wrapped = logWrap(log, { });
            const cb = chai.spy();
            wrapped.stat.increment('foobar', 10, cb);
            wrapped.stat.increment('foobar', 10); // For coverage
            expect(cb).to.have.been.called.exactly(1);
        });
        it('should have a function named "increment"', function () {
            expect(wrapped.stat.increment).to.be.a('function');
            wrapped.stat.increment('foo bar baz');
            // TODO: Add with ... chai-spies seems to be misbehaving when trying to use it?
            expect(statProvider.increment).to.have.been.called.exactly(1);
        });
        it('should have a function named "decrement"', function () {
            expect(wrapped.stat.decrement).to.be.a('function');
            wrapped.stat.decrement('foo bar baz');
            // TODO: Add with ... chai-spies seems to be misbehaving when trying to use it?
            expect(statProvider.decrement).to.have.been.called.exactly(1); // .with('foo bar baz');
        });
        it('should have a function named "histogram"', function () {
            expect(wrapped.stat.histogram).to.be.a('function');
            wrapped.stat.histogram('foo bar baz');
            // TODO: Add with ... chai-spies seems to be misbehaving when trying to use it?
            expect(statProvider.histogram).to.have.been.called.exactly(1); // .with('foo bar baz');
        });
        it('should have a function named "gauge"', function () {
            expect(wrapped.stat.gauge).to.be.a('function');
            wrapped.stat.gauge('foo bar baz');
            // TODO: Add with ... chai-spies seems to be misbehaving when trying to use it?
            expect(statProvider.gauge).to.have.been.called.exactly(1); // .with('foo bar baz');
        });
        it('should have a function named "unique"', function () {
            expect(wrapped.stat.unique).to.be.a('function');
            wrapped.stat.unique('foo bar baz');
            // TODO: Add with ... chai-spies seems to be misbehaving when trying to use it?
            expect(statProvider.unique).to.have.been.called.exactly(1); // .with('foo bar baz');
        });
        it('should have a function named "set"', function () {
            expect(wrapped.stat.set).to.be.a('function');
            wrapped.stat.set('foo bar baz');
            // TODO: Add with ... chai-spies seems to be misbehaving when trying to use it?
            expect(statProvider.set).to.have.been.called.exactly(1); // .with('foo bar baz');
        });
        it('should have a function named "timing"', function () {
            expect(wrapped.stat.timing).to.be.a('function');
            wrapped.stat.timing('foo bar baz');
            // TODO: Add with ... chai-spies seems to be misbehaving when trying to use it?
            expect(statProvider.timing).to.have.been.called.exactly(1); // .with('foo bar baz');
        });
    });
});
