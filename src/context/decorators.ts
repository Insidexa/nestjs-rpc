import { createParamDecorator, SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { RpcMetadata } from '../interfaces';

export const RpcMetadataKey = '__rpc-metadata__';

export const RpcPayload = createParamDecorator((data, req: Request) => {
    return req.body.params;
});

export const RpcId = createParamDecorator((data, req) => {
    return req.body.id || null;
});

export const RpcVersion = createParamDecorator((data, req) => {
    return req.body.jsonrpc;
});

export const RpcMethod = createParamDecorator((data, req) => {
    return req.body.method;
});

export const RpcHandler = (metadata: RpcMetadata) => SetMetadata(RpcMetadataKey, metadata);
