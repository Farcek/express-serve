"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var morgan = require("morgan");
var bluebird = require("bluebird");
var errors = require("./error");
exports.IErrors = errors;
var AccessLogType;
(function (AccessLogType) {
    AccessLogType[AccessLogType["dev"] = 0] = "dev";
    AccessLogType[AccessLogType["combined"] = 1] = "combined";
    AccessLogType[AccessLogType["common"] = 2] = "common";
    AccessLogType[AccessLogType["short"] = 3] = "short";
    AccessLogType[AccessLogType["tiny"] = 4] = "tiny";
})(AccessLogType = exports.AccessLogType || (exports.AccessLogType = {}));
var ExpressServe = (function () {
    function ExpressServe(name, options) {
        this.name = name;
        this.app = express();
        this.options = {
            port: 3000,
        };
        this._viewEngine = false;
        this._preStart = [];
        this._postStart = [];
        if (options) {
            Object.assign(this.options, options);
        }
    }
    ExpressServe.prototype.accessLog = function (type, logMinStatusCode) {
        var morganType = type || AccessLogType.dev;
        this.app.use(morgan(AccessLogType[type], {
            skip: function (req, res) {
                if (req.query['enable_access_log']) {
                    return false;
                }
                if (logMinStatusCode === undefined || logMinStatusCode === null) {
                    return false;
                }
                return res.statusCode <= logMinStatusCode;
            }
        }));
        return this;
    };
    ExpressServe.prototype.router = function (mountPoint) {
        var router = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            router[_i - 1] = arguments[_i];
        }
        this.app.use(mountPoint, router);
        return this;
    };
    ExpressServe.prototype.use = function () {
        var handlers = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            handlers[_i] = arguments[_i];
        }
        this.app.use(handlers);
        return this;
    };
    ExpressServe.prototype.serveStatic = function (mountPoint, rootPath, options) {
        this.app.use(mountPoint, express.static(rootPath, options));
        return this;
    };
    ExpressServe.prototype.errorHandle = function (handle) {
        if (handle) {
            this.app.use(handle);
        }
        else {
            this.app.use(function (err, req, res, next) {
                var error = err || {};
                console.log('--------------------------------------------');
                console.log(error);
                error.stack && console.log(error.stack);
                console.log('--------------------------------------------');
                res.status(error.code || error.status || 500);
                res.json({
                    code: error.code || undefined,
                    name: error.name || 'unnamed error',
                    message: error.message || 'undefined error'
                });
            });
        }
        return this;
    };
    ExpressServe.prototype.onPreStart = function (action) {
        this._preStart.push(action);
        return this;
    };
    ExpressServe.prototype.onPostStart = function (action) {
        this._postStart.push(action);
        return this;
    };
    ExpressServe.prototype.start = function (port) {
        var _this = this;
        var runPort = port || this.options.port;
        return new Promise(function (done) {
            bluebird.mapSeries(_this._preStart, function (action) {
                return action();
            })
                .then(function () {
                return new Promise(function (resolve, reject) {
                    _this.app.listen(runPort, function () {
                        console.log("starting name=" + _this.name + "; port=" + runPort);
                        resolve();
                    });
                });
            })
                .then(function () {
                return bluebird.mapSeries(_this._postStart, function (action) {
                    return action();
                });
            })
                .then(function () { return done(true); })
                .catch(function (err) {
                console.log(err);
                done(false);
            });
        });
    };
    ExpressServe.prototype.viewengineSwig = function (rootDir, options) {
        if (this._viewEngine) {
            throw new Error("view engine initlazed");
        }
        this._viewEngine = true;
        var swig = require('swig');
        var useOptions = {
            cache: (options && options.cache) || false,
            varControls: (options && options.varControls) || ['[{', '}]'],
            tagControls: (options && options.tagControls) || ['[%', '%]'],
            cmtControls: (options && options.cmtControls) || ['[#', '#]'],
        };
        this.app.engine('html', swig.renderFile);
        this.app.set('view engine', 'html');
        this.app.set('views', rootDir);
        this.app.set('view cache', useOptions.cache);
        swig.setDefaults({
            varControls: useOptions.varControls,
            tagControls: useOptions.tagControls,
            cmtControls: useOptions.cmtControls,
            cache: useOptions.cache
        });
        if (options && options.extends && typeof options.extends === 'function') {
            options.extends(swig);
        }
        return this;
    };
    ExpressServe.prototype.crossdomain = function (options) {
        var domains = (options && options.allowDomain) || ['*'];
        var methods = (options && options.allowMethods) || ['GET', 'PUT', 'POST', 'DELETE'];
        var headers = (options && options.allowHeaders) || ['Content-Type', 'Authorization'];
        this.app.use(function (req, res, next) {
            res.header('Access-Control-Allow-Origin', domains.join(' '));
            res.header('Access-Control-Allow-Methods', methods.join(','));
            res.header('Access-Control-Allow-Headers', headers.join(','));
            if ('OPTIONS' === req.method) {
                res.status(200).end();
            }
            else {
                next();
            }
        });
        return this;
    };
    return ExpressServe;
}());
exports.ExpressServe = ExpressServe;
function api404(req, res, next) {
    next(new errors.NotFound("not found uri: \"" + req.originalUrl + "\""));
}
exports.api404 = api404;
//# sourceMappingURL=index.js.map