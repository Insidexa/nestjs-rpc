import { IRpcHandler, RpcHandler } from '../rpc/rpc-explorer';
import { RpcId, RpcPayload, RpcVersion } from '../rpc/decorators';

@RpcHandler({
    method: 'test',
})
export class TestHandler implements IRpcHandler<any> {
    public async invoke(
        @RpcPayload() payload: any,
        @RpcVersion() version: string,
        @RpcId() id: any,
    ) {
        return payload;
    }
}
