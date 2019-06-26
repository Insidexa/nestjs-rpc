import { UseFilters, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { IRpcHandler, RpcHandler } from './rpc/rpc-explorer';

export interface Payload {
}

@RpcHandler({
    method: 'example',
})
export class RpcExampleHandler implements IRpcHandler<Payload> {
    @UseGuards()
    @UseInterceptors()
    @UsePipes()
    @UseFilters()
    public async invoke(payload: Payload) {

    }
}
