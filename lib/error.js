"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var NotFound = (function (_super) {
    __extends(NotFound, _super);
    function NotFound(message) {
        var _this = _super.call(this, message) || this;
        _this.code = 404;
        _this.message = message;
        _this.name = 'not found';
        _this.stack = (new Error()).stack;
        return _this;
    }
    return NotFound;
}(Error));
exports.NotFound = NotFound;
var BadRequest = (function (_super) {
    __extends(BadRequest, _super);
    function BadRequest(message) {
        var _this = _super.call(this, message) || this;
        _this.code = 400;
        _this.message = message;
        _this.name = 'bad request';
        _this.stack = (new Error()).stack;
        return _this;
    }
    return BadRequest;
}(Error));
exports.BadRequest = BadRequest;
//# sourceMappingURL=error.js.map