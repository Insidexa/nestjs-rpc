import { Type } from '@nestjs/common';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';

export interface IRpcHandler<T = unknown> {
    invoke(...args);
}

export interface RpcErrorInterface {
    jsonrpc: string;
    error?: any;
    method?: string;
    id?: number | string | null;
}

export interface RpcRequestInterface {
    jsonrpc: string;
    params?: any;
    id?: number | string | null;
    method: string;
}

export interface RpcResultInterface {
    jsonrpc: string;
    result?: any;
    method?: string;
    id?: number | string | null;
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
    moduleKey: string;
    instanceWrapper: InstanceWrapper<IRpcHandler>;
}
