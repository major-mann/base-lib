describe('console mock', function () {
    var createMock, cons;
    beforeEach(function () {
        createMock = require('../../../src/mocks/console.js');
        cons = createMock();
    });

    it('should be a function', function () {
        expect(createMock).to.be.a('function');
    });
    it('should create an object', function () {
        expect(cons).to.be.an('object');
    });
    it('should have an "$output" function', function () {
        expect(cons.$output).to.be.a('function');
    });
    it('should have a "log" function', function () {
        expect(cons.log).to.be.a('function');
    });
    it('should have a "info" function', function () {
        expect(cons.info).to.be.a('function');
    });
    it('should have a "warn" function', function () {
        expect(cons.warn).to.be.a('function');
    });
    it('should have a "error" function', function () {
        expect(cons.error).to.be.a('function');
    });
    it('should have a "dir" function', function () {
        expect(cons.dir).to.be.a('function');
    });
    it('should have a "time" function', function () {
        expect(cons.time).to.be.a('function');
    });
    it('should have a "timeEnd" function', function () {
        expect(cons.timeEnd).to.be.a('function');
    });
    it('should have a "trace" function', function () {
        expect(cons.trace).to.be.a('function');
    });
    it('should have a "assert" function', function () {
        expect(cons.assert).to.be.a('function');
    });
    it('should call the real console functions if output is true', function () {
        expect(cons.$output()).to.equal(true);
        global.console.warn = chai.spy();
        global.console.info = chai.spy();
        global.console.dir = chai.spy();
        global.console.error = chai.spy();
        cons.warn('foo bar');
        cons.error('bar baz');
        expect(global.console.warn).to.have.been.called.exactly(1);
        expect(global.console.error).to.have.been.called.exactly(1);
        expect(global.console.dir).not.to.have.been.called();
        expect(global.console.info).not.to.have.been.called();
    });
    it('should not call the real console functions if output is false', function () {
        cons.$output(false);
        expect(cons.$output()).to.equal(false);
        global.console.warn = chai.spy();
        global.console.info = chai.spy();
        global.console.dir = chai.spy();
        global.console.error = chai.spy();
        cons.warn('foo bar');
        cons.error('bar baz');
        expect(global.console.warn).not.to.have.been.called();
        expect(global.console.error).not.to.have.been.called();
        expect(global.console.dir).not.to.have.been.called();
        expect(global.console.info).not.to.have.been.called();
    });
});
