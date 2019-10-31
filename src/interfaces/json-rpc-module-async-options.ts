import { Type } from '@nestjs/common';
import { JsonRpcOptionsFactory } from './json-rpc-options-factory';
import { JsonRpcConfig } from './json-rpc-config';

export interface JsonRpcModuleAsyncOptions {
    imports?: any[];
    useExisting?: Type<JsonRpcOptionsFactory>;
    useClass?: Type<JsonRpcOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<JsonRpcConfig> | JsonRpcConfig;
    inject?: any[];
}
