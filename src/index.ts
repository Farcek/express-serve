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
    errorStack?: boolean
}

export interface IErrorHandle {
    (err: errors.IError, req: express.Request, res: express.Response, next: express.NextFunction): void
}

export interface IAction {
    (): Promise<void>
}

export class ExpressServe {
    private app: express.Application = express();
    private options: IOptions = {
        port: 3000,
    };
    constructor(private name: string, options?: IOptions) {
        if (options) {
            Object.assign(this.options, options)
        }
    }

    accessLog(type?: AccessLogType, statusCode?: number) {
        let morganType = type || AccessLogType.dev;
        let skipStatusCode = statusCode || 400;

        // console.log('AccessLogType', AccessLogType)
        // console.log('AccessLogType[type]', AccessLogType[type], type)

        this.app.use(morgan(AccessLogType[type], {
            skip: (req, res) => {
                if (req.query['enable_access_log']) {
                    return false;
                }
                return res.statusCode <= skipStatusCode;
            }
        }));

        return this;
    }

    router(mountPoint: string | RegExp, router: express.Handler) {
        this.app.use(mountPoint, router);
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

    start(port: number): Promise<boolean> {
        return new Promise<boolean>((done) => {
            bluebird.mapSeries(this._preStart, (action) => {
                return action();
            })

                .then(() => {
                    return new Promise((resolve, reject) => {
                        this.app.listen(port, () => {
                            console.log(`starting name=${this.name}; port=${port}`);
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
}



export function api404(req: express.Request, res: express.Response, next: express.NextFunction) {
    next(new errors.NotFound(`not found uri: "${req.originalUrl}"`));
}