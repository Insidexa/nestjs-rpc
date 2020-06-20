import { IRpcHandler, RpcHandler, RpcId, RpcMethod, RpcPayload, RpcVersion } from '../../src';
import { Header } from '@nestjs/common';

@RpcHandler({
    method: 'test',
})
export class CustomHeaderHandler implements IRpcHandler<any> {
    @Header('Handler-Name', CustomHeaderHandler.name)
    public async invoke(
        @RpcPayload() payload: any,
        @RpcVersion() version: string,
        @RpcMethod() method: string,
        @RpcId() id: any,
    ) {
        return payload;
    }
}
