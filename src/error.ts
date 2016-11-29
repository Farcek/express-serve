
export interface IError {

}
export class NotFound extends Error implements IError {
    code = 404
    constructor(message: string) {
        super(message);
        this.message = message;
        this.name = 'not found';
        this.stack = (new Error()).stack;
    }
}

export class BadRequest extends Error implements IError {
    code = 400
    constructor(message: string) {
        super(message);
        this.message = message;
        this.name = 'bad request';
        this.stack = (new Error()).stack;
    }
}