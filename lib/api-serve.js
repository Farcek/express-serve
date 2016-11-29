"use strict";
const express = require('express');
const morgan = require('morgan');
const bluebird = require('bluebird');
const errors = require('./error');
exports.IErrors = errors;
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
        this._preStart = [];
        this._postStart = [];
        if (options) {
            Object.assign(this.options, options);
        }
    }
    accessLog(type, statusCode) {
        let morganType = type || AccessLogType.dev;
        let skipStatusCode = statusCode || 400;
        // console.log('AccessLogType', AccessLogType)
        // console.log('AccessLogType[type]', AccessLogType[type], type)
        this.app.use(morgan(AccessLogType[type], {
            skip: (req, res) => {
                if (req.query['enable_access_log']) {
                    return false;
                }
                return res.statusCode >= skipStatusCode;
            }
        }));
        return this;
    }
    router(mountPoint, router) {
        this.app.use(mountPoint, router);
        return this;
    }
    errorHandle(handle, errorStack) {
        if (handle) {
            this.app.use(handle);
        }
        else {
            this.app.use((err, req, res, next) => {
                let error = err || {};
                console.log('--------------------------------------------');
                console.log(error);
                if (errorStack) {
                    error.stack && console.log(error.stack);
                }
                console.log('--------------------------------------------');
                res.status(error.code || error.status || 500);
                res.json({
                    code: error.code || undefined,
                    name: error.name || 'unnamed error',
                    message: error.message || 'undefined error',
                    stack: errorStack && (error.stack || undefined)
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
        return new Promise((done) => {
            bluebird.mapSeries(this._preStart, (action) => {
                return action();
            })
                .then(() => {
                return new Promise((resolve, reject) => {
                    this.app.listen(port, () => {
                        console.log(`starting name=${this.name}; port=${port}`);
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
}
exports.ExpressServe = ExpressServe;
// export interface IOnSetupApiRoute {
//     (app: express.Application): void
// }
// export interface IBuilderConfig {
//     port: number
//     accessLog: boolean
//     accessLogType: string
//     accessLogStatusCode: number,
//     onSetupApiRoute: IOnSetupApiRoute
//     onErrorHandle: IErrorHandle
//     errorStack: boolean
// }
// export class Builder {
//     private config: IBuilderConfig
//     constructor(private name: string) {
//         this.config = {
//             port: 3000,
//             accessLog: true,
//             accessLogType: 'dev',
//             accessLogStatusCode: 0,
//             onSetupApiRoute: null,
//             onErrorHandle: null,
//             errorStack: true
//         };
//     }
//     setName(name: string) {
//         this.name = name;
//         return this;
//     }
//     setPort(port: number) {
//         this.config.port = port;
//         return this;
//     }
//     setAccessLog(flag: boolean) {
//         this.config.accessLog = flag;
//         return this;
//     }
//     setAccessLogType(type: string): this {
//         this.config.accessLogType = type;
//         return this;
//     }
//     setAccessLogStatusCode(statusCode: number) {
//         this.config.accessLogStatusCode = statusCode;
//         return this;
//     }
//     factory(): express.Application {
//         let app: express.Application = express();
//         app.use(morgan(this.config.accessLogType, {
//             skip: (req, res) => {
//                 if (req.query['enable_access_log']) {
//                     return false;
//                 }
//                 if (res.statusCode >= this.config.accessLogStatusCode) {
//                     return false;
//                 }
//                 return this.config.accessLog;
//             }
//         }));
//         if (this.config.onSetupApiRoute) {
//             this.config.onSetupApiRoute(app);
//         }
//         if (this.config.onErrorHandle) {
//             app.use(this.config.onErrorHandle);
//         } else {
//         }
//         return app;
//     }
// }
function api404(req, res, next) {
    next(new errors.NotFound(`not found uri: "${req.path}"`));
}
exports.api404 = api404;
//# sourceMappingURL=api-serve.js.map