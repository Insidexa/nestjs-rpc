import { RpcHandler, IRpcHandler } from '@jashkasoft/nestjs-json-rpc';
import { UseGuards } from '@nestjs/common';
import { RPCGuard } from './rpc.guard';

@RpcHandler({ method: 'secure' })
export class SecureHandler implements IRpcHandler<any> {
    @UseGuards(RPCGuard)
    public invoke() {
        return 'secure';
    }
}
