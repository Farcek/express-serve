"use strict";
class NotFound extends Error {
    constructor(message) {
        super(message);
        this.code = 404;
        this.message = message;
        this.name = 'not found';
        this.stack = (new Error()).stack;
    }
}
exports.NotFound = NotFound;
class BadRequest extends Error {
    constructor(message) {
        super(message);
        this.code = 400;
        this.message = message;
        this.name = 'bad request';
        this.stack = (new Error()).stack;
    }
}
exports.BadRequest = BadRequest;
//# sourceMappingURL=error.js.map