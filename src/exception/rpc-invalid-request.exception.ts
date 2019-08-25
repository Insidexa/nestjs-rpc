import { JSON_RPC_ERROR_CODES } from './json-rpc-error-codes';
import { RpcException } from './json-rpc.exception';

export class RpcInvalidRequestException extends RpcException {
    constructor() {
        super(
            'Invalid request',
            JSON_RPC_ERROR_CODES.INVALID_REQUEST,
        );
    }
}
