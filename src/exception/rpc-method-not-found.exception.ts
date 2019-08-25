import { JSON_RPC_ERROR_CODES } from './json-rpc-error-codes';
import { RpcException } from './json-rpc.exception';

export class RpcMethodNotFoundException extends RpcException {
    constructor() {
        super(
            'Method not found',
            JSON_RPC_ERROR_CODES.METHOD_NOT_FOUND,
        );
    }
}
