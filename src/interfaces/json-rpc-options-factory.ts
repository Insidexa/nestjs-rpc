import { JsonRpcConfig } from './json-rpc-config';

export interface JsonRpcOptionsFactory {
    createJsonRpcOptions(): Promise<JsonRpcConfig> | JsonRpcConfig;
}
