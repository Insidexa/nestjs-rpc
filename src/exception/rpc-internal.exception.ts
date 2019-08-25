import { RpcException } from './json-rpc.exception';
import { JSON_RPC_ERROR_CODES } from './json-rpc-error-codes';

export class RpcInternalException extends RpcException {
    constructor() {
        super(
            'Internal error',
            JSON_RPC_ERROR_CODES.INTERNAL_ERROR,
        );
    }
}
