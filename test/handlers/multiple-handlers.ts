import { RpcHandler, RpcId, RpcMethod, RpcMethodHandler, RpcPayload, RpcVersion } from '../../src';

@RpcHandler({
    method: 'prefix',
})
export class MultipleHandlers {
    @RpcMethodHandler('subMethod')
    public async subMethod(
        @RpcPayload() payload: any,
        @RpcVersion() version: string,
        @RpcMethod() method: string,
        @RpcId() id: any,
    ) {
        return payload;
    }

    @RpcMethodHandler('subMethod1')
    public async subMethod1(
        @RpcPayload() payload: any,
        @RpcVersion() version: string,
        @RpcMethod() method: string,
        @RpcId() id: any,
    ) {
        return payload;
    }
}
