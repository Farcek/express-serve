/// <reference types="express" />
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
}
export interface IErrorHandle {
    (err: errors.IError, req: express.Request, res: express.Response, next: express.NextFunction): void;
}
export interface IAction {
    (): Promise<void>;
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
export declare class ExpressServe {
    private name;
    private app;
    private options;
    private _viewEngine;
    constructor(name: string, options?: IOptions);
    accessLog(type?: AccessLogType, logMinStatusCode?: number): this;
    router(mountPoint: string | RegExp | (string | RegExp)[], ...router: express.Handler[]): this;
    use(...handlers: express.Handler[]): this;
    serveStatic(mountPoint: string | RegExp | (string | RegExp)[], rootPath: string, options?: IServeStatic): this;
    errorHandle(handle?: IErrorHandle): this;
    private _preStart;
    onPreStart(action: IAction): this;
    private _postStart;
    onPostStart(action: IAction): this;
    start(port?: number): Promise<boolean>;
    viewengineSwig(rootDir: string, options?: IViewengineOptions): this;
    crossdomain(options?: ICrossdomainOptions): this;
}
export interface IViewengineOptions {
    cache?: boolean;
    varControls?: [string, string];
    tagControls?: [string, string];
    cmtControls?: [string, string];
}
export interface ICrossdomainOptions {
    allowDomain?: string[];
    allowMethods?: string[];
    allowHeaders?: string[];
}
export declare function api404(req: express.Request, res: express.Response, next: express.NextFunction): void;
