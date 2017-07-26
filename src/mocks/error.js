const OriginalError = global.Error;

module.exports = function createMock(Err) {
    if (typeof Err !== 'function') {
        Err = OriginalError;
    }
    return MockError;

    /** A mock error that allows the stack to be set */
    function MockError(...args) {
        if (this instanceof MockError === false) {
            return new MockError(...args);
        }
        Object.setPrototypeOf(this, new Err(...args));
        const ostack = this.stack;
        let stack = undefined;
        this.$stack = setStack;

        Object.defineProperty(this, 'stack', {
            configurable: true,
            enumerable: false,
            get() {
                if (stack === undefined) {
                    return ostack;
                } else {
                    return stack;
                }
            }
        });

        /** Sets the error stack */
        function setStack(s) {
            if (arguments.length) {
                if (s) {
                    stack = s;
                } else {
                    stack = undefined;
                }
            }
            return stack || ostack;
        }
    }
};
