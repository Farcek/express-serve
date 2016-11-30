import * as express from 'express';
import * as errors from './error';
export { errors as IErrors };
export declare enum AccessLogType {
    dev = 0,
    combined = 1,
    common = 2,
    short = 3,
    tiny = 4,
}
export interface IOptions {
    port?: number;
    errorStack?: boolean;
}
export interface IErrorHandle {
    (err: errors.IError, req: express.Request, res: express.Response, next: express.NextFunction): void;
}
export interface IAction {
    (): Promise<void>;
}
export declare class ExpressServe {
    private name;
    private app;
    private options;
    constructor(name: string, options?: IOptions);
    accessLog(type?: AccessLogType, statusCode?: number): this;
    router(mountPoint: string | RegExp, router: express.Handler): this;
    errorHandle(handle?: IErrorHandle): this;
    private _preStart;
    onPreStart(action: IAction): this;
    private _postStart;
    onPostStart(action: IAction): this;
    start(port: number): Promise<boolean>;
}
export declare function api404(req: express.Request, res: express.Response, next: express.NextFunction): void;
