import {
    applyDecorators,
    createParamDecorator,
    ExecutionContext,
    Injectable,
    InjectableOptions,
    SetMetadata
} from '@nestjs/common';
import { RpcMetadata } from '../interfaces';

export const RpcMetadataKey = '__rpc-metadata__';

export const RpcMethodMetadataKey = '__rpc-method-metadata__';

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

export const RpcHandler = (data?: RpcMetadata & InjectableOptions) => {
    const scope = data ? data.scope : undefined;
    const method = data ? data.method : '';
    return applyDecorators(
        SetMetadata(RpcMetadataKey, { method }),
        Injectable({ scope }),
    );
};

export const RpcMethodHandler =(name: string) => {
    return applyDecorators(
        SetMetadata(RpcMethodMetadataKey, { name }),
    );
};
