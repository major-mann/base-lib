// Constants
const OriginalDate = global.Date;

module.exports = function createMock(locked, offset) {
    if (locked !== undefined && !Number.isInteger(locked)) {
        locked = undefined;
    }
    if (!Number.isInteger(offset)) {
        offset = 0;
    }

    Object.setPrototypeOf(MockDate, OriginalDate);
    MockDate.$lockTime = lockTime;
    MockDate.$offsetTime = offsetTime;
    MockDate.now = now;

    return MockDate;

    function MockDate() {
        if (this instanceof MockDate === false) {
            // eslint-disable-next-line new-cap
            return OriginalDate();
        }
        let args;
        if (arguments.length === 0) {
            args = [now()];
        } else {
            args = [...arguments];
        }
        return new OriginalDate(...args);
    }

    /** Returns a locked time if one is defined, otherwise the current time with the offset applied */
    function now() {
        if (locked === undefined) {
            return OriginalDate.now() + offset;
        } else {
            return locked + offset;
        }
    }

    /** Ensures all calls that expect now to be returned will get this instead (if it is a positive integer) */
    function lockTime(time) {
        if (arguments.length) {
            if (Number.isInteger(time)) {
                locked = time;
            } else if (time === false) {
                locked = undefined;
            }
        }
        return locked;
    }

    /** Offsets all requests for time */
    function offsetTime(time) {
        if (Number.isInteger(time)) {
            offset = time;
        }
        return offset;
    }
};
