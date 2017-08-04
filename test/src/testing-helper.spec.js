describe('Testing helper', function () {
    it('it should expose testing globals', function () {
        expect(global.chai).to.be.an('object');
        expect(global.expect).to.be.a('function');
        expect(global.mock).to.be.an('object');
        expect(global.mockery).to.be.an('object');
    });
    it('should add a callsback helper to chai.spy', function () {
        expect(global.chai.spy.callsback).to.be.a('function');
        const err = {};
        const res = {};
        const func = global.chai.spy.callsback(err, res);
        const cb = chai.spy(function callback(e, r) {
            expect(e).to.equal(err);
            expect(r).to.equal(res);
        });
        func(cb);
        expect(cb).to.have.been.called();
    });
    it('should throw an error if no callback is supplied and optional is falsy', function () {
        const func = global.chai.spy.callsback(null, null, false);
        expect(() => func()).to.throw(/not.*function/ig);
    });
    it('should not throw an error if no callback is supplied and optional is truthy', function () {
        const func = global.chai.spy.callsback(null, null, true);
        expect(() => func()).not.to.throw();
    });
});
