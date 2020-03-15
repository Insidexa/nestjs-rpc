NestJS JSON RPC package - [nestjs-json-rpc](https://www.npmjs.com/package/@jashkasoft/nestjs-json-rpc) npm package

`npm i --save @jashkasoft/nestjs-json-rpc`

Implemented JSON RPC [specification](https://www.jsonrpc.org/specification)

How to use:
 - import module `RpcModule`, example  
```typescript
        JsonRpcModule.forRoot({
            path: '/rpc', // path to RPC
        })
```
 
 - every request to RPC is POST method and response status = 200
 
 - create rpc handler  
```typescript
import { RpcId, RpcPayload, RpcVersion, RpcMethod, IRpcHandler, RpcHandler } from '@jashkasoft/nestjs-json-rpc';

@RpcHandler({
    method: 'test',
})
export class TestHandler implements IRpcHandler<Payload> {
    public async invoke(
        @RpcPayload() payload: Payload,
        @RpcVersion() version: string,
        @RpcId() id: number | string,
        @RpcMethod() method: string
    ) {
        return payload;
    }
}
```

 - add `TestHandler` to providers array  


See examples in tests

How to use  
Example simple request to handler  
request:
```bash
curl -X POST "http://localhost:3002/rpc" -H "accept: application/json" -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "example", "params": 2}'
```  

response:  
```json
{"jsonrpc":"2.0","result":2,"id":null}
```

Batch requests  
request:  
```bash
curl -X POST "http://localhost:3002/rpc" -H "accept: application/json" -H "Content-Type: application/json" -d '[{"jsonrpc": "2.0", "method": "example", "params": 2}, { "jsonrpc": "2.0", "method": "test" }]'
```  
response:  
```json
[{"jsonrpc":"2.0","result":2,"id":null}]
```

 
 
Fields description

| field |  decorator |  description | required  | other  |
|---|---|---|---|---|
| `params` | `@RpcPayload()`  |  get payload ( params ) | false  |   | 
| `jsonrpc` | `@RpcVersion()` | get rpc version  | true  |   |   |
| `method` | `@RpcMethod()` | get rpc version  | true  |   |   |
| `id` | `@RpcId()`  | get client operation id  | false  | if not send - response not send, RPC notification  |


However, you don't have an access to the native response object in
Exception filters, Interceptors and Guards (as in the HTTP app).  
Because RPCModule in rpc batch request collect responses from handlers
and if you using response you override headers or send response in some handlers.
Maybe, you can receive errors, for example `headers already sent`.  
