export class RpcException extends Error {
    public readonly message: any;

    constructor(
        message: string | object,
        private readonly code: number,
    ) {
        super();
        this.message = message;
    }

    public getCode(): number {
        return this.code;
    }
}
