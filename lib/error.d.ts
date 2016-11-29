export interface IError {
}
export declare class NotFound extends Error implements IError {
    code: number;
    constructor(message: string);
}
export declare class BadRequest extends Error implements IError {
    code: number;
    constructor(message: string);
}
