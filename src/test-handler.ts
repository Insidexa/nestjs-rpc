import { Body, UseFilters, UseGuards, UseInterceptors, UsePipes, } from '@nestjs/common';
import { IRpcHandler, RpcHandler } from './rpc/rpc-explorer';
import { RpcId, RpcPayload, RpcVersion } from './rpc/decorators';
import { AuthGuard, HttpExceptionFilter, LoggingInterceptor, ValidationPipe } from './rpc-example-handler';

@RpcHandler({
    method: 'test',
})
export class TestHandler implements IRpcHandler<any> {
    @UseGuards(AuthGuard)
    @UseInterceptors(LoggingInterceptor)
    @UsePipes(ValidationPipe)
    @UseFilters(HttpExceptionFilter)
    public async invoke(
        @RpcPayload() payload: any,
        @RpcVersion() version: string,
        @RpcId() id: any,
        @Body() body,
    ) {
        return payload;
    }
}
