import { RpcErrorInterface, RpcRequestInterface, RpcResultInterface } from './interfaces';

export type Fn = (...args) => any;

export type RpcRequest = RpcRequestInterface | RpcRequestInterface[];
export type RpcResult = RpcResultInterface | RpcResultInterface[];
export type RpcResponse = RpcRequest | RpcResult;
export type ResponseBatch = (RpcResultInterface | RpcErrorInterface | null)[];

export type ProxyCallback = <TRequest, TResponse>(
    req?: TRequest,
    res?: TResponse,
    next?: () => void,
) => unknown;
