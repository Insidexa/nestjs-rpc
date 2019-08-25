export interface RpcResultInterface {
    jsonrpc: string;
    result?: any;
    method?: string;
    id?: number | string | null | undefined;
}
