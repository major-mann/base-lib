describe('Interval mock', function () {
    var createIntervalMock, intervalMock;

    beforeEach(function () {
        createIntervalMock = require('../../../src/mocks/interval.js');
        intervalMock = createIntervalMock();
    });

    afterEach(function () {
        intervalMock.setInterval.$clear();
    });

    it('should be a function', function () {
        expect(createIntervalMock).to.be.a('function');
    });
    it('should create an object', function () {
        expect(intervalMock).to.be.an('object');
    });
    it('should have a setInterval function', function () {
        expect(intervalMock.setInterval).to.be.a('function');
    });
    it('should have a clearInterval function', function () {
        expect(intervalMock.clearInterval).to.be.a('function');
    });
    it('should have a $flush function', function () {
        expect(intervalMock.setInterval.$flush).to.be.a('function');
    });
    it('should have a $clear function', function () {
        expect(intervalMock.setInterval.$clear).to.be.a('function');
    });
    it('should operate like a normal set interval', function (done) {
        const f1 = chai.spy();
        intervalMock.setInterval(f1, 10);
        setTimeout(function () {
            try {
                expect(f1).to.have.been.called.exactly(3);
                done();
            } catch (ex) {
                done(ex);
            }
        }, 39);
    });
    it('should return a Timeout object', function () {
        const f1 = chai.spy();
        const ref = intervalMock.setInterval(f1, 10);
        expect(ref.unref).to.be.a('function');
    });
    it('should remove all handlers when $clear is called', function (done) {
        const f1 = chai.spy(),
            f2 = chai.spy();

        intervalMock.setInterval(f1, 10);
        intervalMock.setInterval(f2, 10);
        intervalMock.setInterval.$clear();
        setTimeout(function () {
            try {
                expect(f1).not.to.have.been.called();
                expect(f2).not.to.have.been.called();
                done();
            } catch (ex) {
                done(ex);
            }
        }, 20);
    });
    it('should move the internal timer forward the specified number of milliseconds when calling flush', function () {
        const f1 = chai.spy(),
            f2 = chai.spy();
        const ref = intervalMock.setInterval(f1, 1000);
        intervalMock.setInterval(f2, 2000);
        intervalMock.setInterval.$flush(1500);
        expect(f1).to.have.been.called.exactly(1);
        expect(f2).not.to.have.been.called();

        intervalMock.setInterval.$flush('foo bar baz'); // For coverage
        intervalMock.setInterval.$flush(1000);
        expect(f1).to.have.been.called.exactly(2);
        expect(f2).to.have.been.called.exactly(1);

        // For coverage
        intervalMock.clearInterval(ref);
        intervalMock.clearInterval(ref);
    });
    it('should not execute a handler after clearInterval is called', function () {
        const f1 = chai.spy();
        const ref = intervalMock.setInterval(f1, 1000);
        intervalMock.setInterval.$flush(1500);
        expect(f1).to.have.been.called.exactly(1);
        intervalMock.clearInterval(ref);
        intervalMock.setInterval.$flush(1000);
        expect(f1).to.have.been.called.exactly(1);
    });
});
