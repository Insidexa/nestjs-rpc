import { RpcHandler, RpcId, RpcMethod, RpcMethodHandler, RpcPayload, RpcVersion } from '../../src';

@RpcHandler()
export class WithoutParentMethod {
    @RpcMethodHandler('withoutParentMethod')
    public async subMethod(
        @RpcPayload() payload: any,
        @RpcVersion() version: string,
        @RpcMethod() method: string,
        @RpcId() id: any,
    ) {
        return 'withoutParentMethod';
    }
}
