describe('Error mock', function () {
    var createMockError, MockError;
    beforeEach(function () {
        createMockError = require('../../../src/mocks/error.js');
        MockError = createMockError();
    });

    it('should be a function', function () {
        expect(createMockError).to.be.a('function');
    });
    it('should return a function', function () {
        expect(MockError).to.be.a('function');
    });
    it('should allow a custom error base class to be defined', function () {
        const TestMock = createMockError(TypeError);
        const err = new TestMock();
        expect(err instanceof TypeError).to.equal(true);
    });
    it('should return a new instance if not called with the new keyword', function () {
        // eslint-disable-next-line new-cap
        const err = MockError();
        expect(err instanceof Error).to.equal(true);
    });
    it('should allow a custom stack to be provided', function () {
        const err = new MockError();
        err.$stack('foo bar baz');
        expect(err.stack).to.equal('foo bar baz');
    });
    it('should return the standard stack if no custom is supplied', function () {
        const err = new MockError();
        const orig = err.stack;
        expect(orig).to.be.a('string');
        err.$stack('foo bar baz');
        expect(err.stack).to.equal('foo bar baz');
        err.$stack(false);
        expect(err.stack).to.equal(orig);
    });
});
