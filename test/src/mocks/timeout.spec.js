describe('timeout mock', function () {
    var createTimeoutMock, timeoutMock;

    beforeEach(function () {
        createTimeoutMock = require('../../../src/mocks/timeout.js');
        timeoutMock = createTimeoutMock();
    });

    it('should be a function', function () {
        expect(createTimeoutMock).to.be.a('function');
    });
    it('should create an object', function () {
        expect(timeoutMock).to.be.an('object');
    });
    it('should have a setTimeout function', function () {
        expect(timeoutMock.setTimeout).to.be.a('function');
    });
    it('should have a clearTimeout function', function () {
        expect(timeoutMock.clearTimeout).to.be.a('function');
    });
    it('should have a $flush function', function () {
        expect(timeoutMock.setTimeout.$flush).to.be.a('function');
    });
    it('should execute all pending handlers when $flush is called', function () {
        const f1 = chai.spy(),
            f2 = chai.spy(),
            f3 = chai.spy(),
            f4 = chai.spy(),
            f5 = chai.spy();
        timeoutMock.setTimeout(f1, 1000);
        timeoutMock.setTimeout(f2, 2000);
        timeoutMock.setTimeout(f3, 3000);
        timeoutMock.setTimeout(f4, 4000);
        timeoutMock.setTimeout(f5, 5000);

        expect(f1).not.to.have.been.called();
        expect(f2).not.to.have.been.called();
        expect(f3).not.to.have.been.called();
        expect(f4).not.to.have.been.called();
        expect(f5).not.to.have.been.called();

        timeoutMock.setTimeout.$flush();

        expect(f1).to.have.been.called.exactly(1);
        expect(f2).to.have.been.called.exactly(1);
        expect(f3).to.have.been.called.exactly(1);
        expect(f4).to.have.been.called.exactly(1);
        expect(f5).to.have.been.called.exactly(1);

        timeoutMock.setTimeout.$flush();

        expect(f1).to.have.been.called.exactly(1);
        expect(f2).to.have.been.called.exactly(1);
        expect(f3).to.have.been.called.exactly(1);
        expect(f4).to.have.been.called.exactly(1);
        expect(f5).to.have.been.called.exactly(1);
    });
    it('should actually do the flush after the specified timeout', function (done) {
        const f1 = chai.spy();
        timeoutMock.setTimeout(f1, 1000);
        timeoutMock.setTimeout.$flush(20);
        setTimeout(function () {
            try {
                expect(f1).not.to.have.been.called();
            } catch (ex) {
                done(ex);
            }
        }, 10);
        setTimeout(function () {
            try {
                expect(f1).to.have.been.called.exactly(1);
                done();
            } catch (ex) {
                done(ex);
            }
        }, 30);
    });
    it('should have a $verifyNoPendingTasks function', function () {
        expect(timeoutMock.setTimeout.$verifyNoPendingTasks).to.be.a('function');
    });
    it('should throw an error if there are outstanding handlers when $verifyNoPendingTasks is called', function () {
        expect(() => timeoutMock.setTimeout.$verifyNoPendingTasks()).not.to.throw();
        const f1 = chai.spy();
        timeoutMock.setTimeout(f1, 1000);
        expect(() => timeoutMock.setTimeout.$verifyNoPendingTasks()).to.throw();
        timeoutMock.setTimeout.$flush();
        expect(f1).to.have.been.called.exactly(1);
        expect(() => timeoutMock.setTimeout.$verifyNoPendingTasks()).not.to.throw();
    });
    it('should execute the handler with setTimeout as normal if $flush is not called', function (done) {
        var flag = false,
            t2,
            t3;
        timeoutMock.setTimeout(function () {
            try {
                expect(flag).to.equal(false);
                flag = true;
            } catch (ex) {
                timeoutMock.clearTimeout(t2);
                timeoutMock.clearTimeout(t3);
                done(ex);
            }
        }, 10);
        t2 = timeoutMock.setTimeout(function () {
            try {
                expect(flag).to.equal(true);
            } catch (ex) {
                timeoutMock.clearTimeout(t3);
                done(ex);
            }
        }, 20);
        t3 = timeoutMock.setTimeout(done, 30);
    });
    it('should not execute the handler after clearTimeout is called', function () {
        const f1 = chai.spy();
        const ref = timeoutMock.setTimeout(f1, 1000);
        timeoutMock.clearTimeout(ref);
        timeoutMock.setTimeout.$flush();
        expect(f1).not.to.have.been.called();
    });
});
