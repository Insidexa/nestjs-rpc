import { createParamDecorator } from '@nestjs/common';
import { Request } from 'express';

export const RpcPayload = createParamDecorator((data, req: Request) => {
    return req.body.params;
});

export const RpcId = createParamDecorator((data, req) => {
    return req.body.id || null;
});

export const RpcVersion = createParamDecorator((data, req) => {
    return req.body.jsonrpc;
});
