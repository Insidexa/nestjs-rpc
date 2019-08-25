export interface RpcRequestInterface {
    jsonrpc: string;
    params?: any;
    id?: number | string | null | undefined;
    method: string;
}
