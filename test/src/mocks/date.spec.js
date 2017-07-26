describe('Date mock', function () {
    var createMock, MockDate;

    beforeEach(function () {
        createMock = require('../../../src/mocks/date.js');
        MockDate = createMock();
    });

    it('should be a function', function () {
        expect(createMock).to.be.a('function');
    });
    it('should create a function', function () {
        expect(MockDate).to.be.a('function');
    });
    it('should have a static function "$lockTime"', function () {
        expect(MockDate.$lockTime).to.be.a('function');
    });
    it('should have a static function "$offsetTime"', function () {
        expect(MockDate.$offsetTime).to.be.a('function');
    });
    it('should allow an initial lock time to be set when creating the mock', function () {
        const MD = createMock(123);
        expect(MD.$lockTime()).to.equal(123);
    });
    it('should only set initial lock time to be set when creating the mock if the value supplied is an integer', function () {
        const MD = createMock(123.5);
        expect(MD.$lockTime()).to.equal(undefined);
    });
    it('should allow an initial offset time to be set when creating the mock', function () {
        const MD = createMock(123, 456);
        expect(MD.$lockTime()).to.equal(123);
        expect(MD.$offsetTime()).to.equal(456);
    });
    it('should return a string when called directly', function () {
        // eslint-disable-next-line new-cap
        expect(MockDate()).to.equal(Date());
    });
    it('should create a Date at the correct moment', function () {
        const dt = new MockDate(12345);
        expect(dt.getTime()).to.equal(12345);
    });
    it('should always return the lock time when one is applied', function () {
        MockDate.$lockTime(12345);
        expect(MockDate.now()).to.equal(12345);
    });
    it('should disable lock time when false is supplied', function () {
        MockDate.$lockTime(12345);
        expect(MockDate.now()).to.equal(12345);
        MockDate.$lockTime('foo bar baz'); // For coverage
        MockDate.$lockTime(false);
        expect(Math.abs(MockDate.now() - Date.now()) < 10).to.equal(true);
    });
    it('should return the current time when no lock time is supplied', function () {
        const current = Date.now();
        expect(MockDate.now()).to.equal(current);
    });
    it('should offset the time by the specified amount when offset time is set', function () {
        MockDate.$offsetTime(123);
        const current = Date.now();
        expect(MockDate.now()).to.equal(current + 123);
    });
    it('should create an instance of Date', function () {
        var dt = new MockDate();
        expect(dt instanceof Date).to.equal(true);
    });
});
