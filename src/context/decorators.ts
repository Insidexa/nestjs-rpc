import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { RpcMetadata } from '../interfaces';

export const RpcMetadataKey = '__rpc-metadata__';

export const RpcPayload = createParamDecorator((data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.body.params;
});

export const RpcId = createParamDecorator((data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.body.id || null;
});

export const RpcVersion = createParamDecorator((data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.body.jsonrpc;
});

export const RpcMethod = createParamDecorator((data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.body.method;
});

export const RpcHandler = (metadata: RpcMetadata) => SetMetadata(RpcMetadataKey, metadata);