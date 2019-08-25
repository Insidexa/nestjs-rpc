export interface RpcErrorInterface {
    jsonrpc: string;
    error?: any;
    method?: any;
    id?: number | string | null | undefined;
}
