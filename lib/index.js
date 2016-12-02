"use strict";
const express = require('express');
const morgan = require('morgan');
const bluebird = require('bluebird');
const errors = require('./error');
exports.IErrors = errors;
const extend = require('extend');
(function (AccessLogType) {
    AccessLogType[AccessLogType["dev"] = 0] = "dev";
    AccessLogType[AccessLogType["combined"] = 1] = "combined";
    AccessLogType[AccessLogType["common"] = 2] = "common";
    AccessLogType[AccessLogType["short"] = 3] = "short";
    AccessLogType[AccessLogType["tiny"] = 4] = "tiny";
})(exports.AccessLogType || (exports.AccessLogType = {}));
var AccessLogType = exports.AccessLogType;
class ExpressServe {
    constructor(name, options) {
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
    accessLog(type, logMinStatusCode) {
        let morganType = type || AccessLogType.dev;
        this.app.use(morgan(AccessLogType[type], {
            skip: (req, res) => {
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
    }
    router(mountPoint, ...router) {
        this.app.use(mountPoint, router);
        return this;
    }
    serveStatic(mountPoint, rootPath, options) {
        this.app.use(mountPoint, express.static(rootPath, options));
        return this;
    }
    errorHandle(handle) {
        if (handle) {
            this.app.use(handle);
        }
        else {
            this.app.use((err, req, res, next) => {
                let error = err || {};
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
    }
    onPreStart(action) {
        this._preStart.push(action);
        return this;
    }
    onPostStart(action) {
        this._postStart.push(action);
        return this;
    }
    start(port) {
        let runPort = port || this.options.port;
        return new Promise((done) => {
            bluebird.mapSeries(this._preStart, (action) => {
                return action();
            })
                .then(() => {
                return new Promise((resolve, reject) => {
                    this.app.listen(runPort, () => {
                        console.log(`starting name=${this.name}; port=${runPort}`);
                        resolve();
                    });
                });
            })
                .then(() => {
                return bluebird.mapSeries(this._postStart, (action) => {
                    return action();
                });
            })
                .then(() => done(true))
                .catch(err => {
                console.log(err);
                done(false);
            });
        });
    }
    viewengineSwig(rootDir, options) {
        if (this._viewEngine) {
            throw new Error("view engine initlazed");
        }
        this._viewEngine = true;
        let swig = require('swig');
        let defaultOptions = {
            cache: false,
            varControls: ['[{', '}]'],
            tagControls: ['[%', '%]'],
            cmtControls: ['[#', '#]'],
        };
        let useOptions = extend(defaultOptions, options || {});
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
        return this;
    }
    crossdomain(options) {
        let domains = (options && options.allowDomain) || ['*'];
        let methods = (options && options.allowMethods) || ['GET', 'PUT', 'POST', 'DELETE'];
        let headers = (options && options.allowHeaders) || ['Content-Type', 'Authorization'];
        this.app.use((req, res, next) => {
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
    }
}
exports.ExpressServe = ExpressServe;
function api404(req, res, next) {
    next(new errors.NotFound(`not found uri: "${req.originalUrl}"`));
}
exports.api404 = api404;
//# sourceMappingURL=index.js.map