import { Type } from '@nestjs/common';

export interface IRpcHandler<T> {
    invoke(...args);
}

export interface RpcErrorInterface {
    jsonrpc: string;
    error?: any;
    method?: any;
    id?: number | string | null | undefined;
}

export interface RpcRequestInterface {
    jsonrpc: string;
    params?: any;
    id?: number | string | null | undefined;
    method: string;
}

export interface RpcResultInterface {
    jsonrpc: string;
    result?: any;
    method?: string;
    id?: number | string | null | undefined;
}

export interface JsonRpcConfig {
    path: string;
}

export interface JsonRpcOptionsFactory {
    createJsonRpcOptions(): Promise<JsonRpcConfig> | JsonRpcConfig;
}

export interface JsonRpcModuleAsyncOptions {
    imports: any[];
    useExisting: Type<JsonRpcOptionsFactory>;
    useClass: Type<JsonRpcOptionsFactory>;
    useFactory: (...args: any[]) => Promise<JsonRpcConfig> | JsonRpcConfig;
    inject: any[];
}

export interface RpcMetadata {
    method: string;
}

export interface RpcHandlerInfo {
    method: string;
    id: string;
    instance: IRpcHandler<any>;
}
