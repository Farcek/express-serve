import * as express from 'express';
import * as morgan from 'morgan';
import * as bluebird from 'bluebird';
import * as errors from './error';

export {
    errors as IErrors
}
export enum AccessLogType {
    dev, combined, common, short, tiny
}

export interface IOptions {
    port?: number
    //errorStack?: boolean
}

export interface IErrorHandle {
    (err: errors.IError, req: express.Request, res: express.Response, next: express.NextFunction): void
}

export interface IAction {
    (): Promise<void>
}

export interface IServeStatic {
    /**
     * Set how "dotfiles" are treated when encountered. A dotfile is a file or directory that begins with a dot (".").
     * Note this check is done on the path itself without checking if the path actually exists on the disk.
     * If root is specified, only the dotfiles above the root are checked (i.e. the root itself can be within a dotfile when when set to "deny").
     * The default value is 'ignore'.
     * 'allow' No special treatment for dotfiles
     * 'deny' Send a 403 for any request for a dotfile
     * 'ignore' Pretend like the dotfile does not exist and call next()
     */
    dotfiles?: string;

    /**
     * Enable or disable etag generation, defaults to true.
     */
    etag?: boolean;

    /**
     * Set file extension fallbacks. When set, if a file is not found, the given extensions will be added to the file name and search for.
     * The first that exists will be served. Example: ['html', 'htm'].
     * The default value is false.
     */
    extensions?: string[];

    /**
     * Let client errors fall-through as unhandled requests, otherwise forward a client error.
     * The default value is false.
     */
    fallthrough?: boolean;

    /**
     * By default this module will send "index.html" files in response to a request on a directory.
     * To disable this set false or to supply a new index pass a string or an array in preferred order.
     */
    index?: boolean | string | string[];

    /**
     * Enable or disable Last-Modified header, defaults to true. Uses the file system's last modified value.
     */
    lastModified?: boolean;

    /**
     * Provide a max-age in milliseconds for http caching, defaults to 0. This can also be a string accepted by the ms module.
     */
    maxAge?: number | string;

    /**
     * Redirect to trailing "/" when the pathname is a dir. Defaults to true.
     */
    redirect?: boolean;

    /**
     * Function to set custom headers on response. Alterations to the headers need to occur synchronously.
     * The function is called as fn(res, path, stat), where the arguments are:
     * res the response object
     * path the file path that is being sent
     * stat the stat object of the file that is being sent
     */
    setHeaders?: (res: express.Response, path: string, stat: any) => any;
}

export class ExpressServe {
    private app: express.Application = express();
    private options: IOptions = {
        port: 3000,
    };
    private _viewEngine = false;
    constructor(private name: string, options?: IOptions) {
        if (options) {
            Object.assign(this.options, options)
        }
    }

    accessLog(type?: AccessLogType, logMinStatusCode?: number) {
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

    router(mountPoint: string | RegExp | (string | RegExp)[], ...router: express.Handler[]) {
        this.app.use(mountPoint, router);
        return this;
    }
    use(...handlers: express.Handler[]) {
        this.app.use(handlers);
        return this;
    }

    serveStatic(mountPoint: string | RegExp | (string | RegExp)[], rootPath: string, options?: IServeStatic) {
        this.app.use(mountPoint, express.static(rootPath, options));
        return this;
    }

    errorHandle(handle?: IErrorHandle) {
        if (handle) {
            this.app.use(handle);
        } else {
            this.app.use((err: errors.IError, req: express.Request, res: express.Response, next: express.NextFunction) => {

                let error: any = err || {};
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

    private _preStart: IAction[] = [];
    onPreStart(action: IAction) {
        this._preStart.push(action);
        return this;
    }

    private _postStart: IAction[] = [];
    onPostStart(action: IAction) {
        this._postStart.push(action);
        return this;
    }

    start(port?: number): Promise<boolean> {
        let runPort = port || this.options.port;
        return new Promise<boolean>((done) => {
            bluebird.mapSeries(this._preStart, (action) => {
                return action();
            })

                .then(() => {
                    return new Promise((resolve, reject) => {
                        this.app.listen(runPort, () => {
                            console.log(`starting name=${this.name}; port=${runPort}`);
                            resolve();
                        });
                    })
                })
                .then(() => {
                    return bluebird.mapSeries(this._postStart, (action) => {
                        return action();
                    })
                })
                .then(() => done(true))
                .catch(err => {
                    console.log(err);
                    done(false);
                });
        })

    }

    viewengineSwig(rootDir: string, options?: IViewengineOptions) {
        if (this._viewEngine) {
            throw new Error("view engine initlazed");
        }
        this._viewEngine = true;

        let swig: { setDefaults: any, renderFile: any } = require('swig');
        let useOptions: IViewengineOptions = {
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
    }
    crossdomain(options?: ICrossdomainOptions) {
        let domains = (options && options.allowDomain) || ['*'];
        let methods = (options && options.allowMethods) || ['GET', 'PUT', 'POST', 'DELETE'];
        let headers = (options && options.allowHeaders) || ['Content-Type', 'Authorization'];

        this.app.use((req: express.Request, res: express.Response, next) => {
            res.header('Access-Control-Allow-Origin', domains.join(' '));
            res.header('Access-Control-Allow-Methods', methods.join(','));
            res.header('Access-Control-Allow-Headers', headers.join(','));
            if ('OPTIONS' === req.method) {
                res.status(200).end();
            } else {
                next();
            }
        })
        return this;
    }
}

export interface IViewengineOptions {
    cache?: boolean
    varControls?: [string, string]
    tagControls?: [string, string]
    cmtControls?: [string, string]

    extends?: (swig: any) => void
}
export interface ICrossdomainOptions {
    allowDomain?: string[]
    allowMethods?: string[]
    allowHeaders?: string[]
}

export function api404(req: express.Request, res: express.Response, next: express.NextFunction) {
    next(new errors.NotFound(`not found uri: "${req.originalUrl}"`));
}