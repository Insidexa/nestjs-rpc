NestJS JSON RPC package

How to use:
 - import module `RpcModule`, example  
```typescript
        RpcModule.forRoot({
            path: '/rpc', // path to RPC
        })
```
 
 - every request to RPC is POST method and response status = 200
 
 - create rpc handler  
```typescript
import { IRpcHandler, RpcHandler } from '../src/rpc/rpc-explorer';
import { RpcId, RpcPayload, RpcVersion } from '../src/rpc/decorators';

@RpcHandler({
    method: 'test',
})
export class TestHandler implements IRpcHandler<Payload> {
    public async invoke(
        @RpcPayload() payload: Payload,
        @RpcVersion() version: string,
        @RpcId() id: any,
    ) {
        return payload;
    }
}
```

|  name |  description | required  | other  |
|---|---|---|---|
| `@RpcPayload()`  |  get payload ( params ) | false  |   | 
| `@RpcVersion()` | get rpc version  | true  |   |   |
| `@RpcId()`  | get client operation id  | false  | if not send - response not send, RPC notification  |


Example simple request to handler:  
request --> `curl -X POST "http://localhost:3002/rpc" -H "accept: application/json" -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "example", "params": 2}'`  
response <-- `{"jsonrpc":"2.0","result":2,"id":null}`

Batch requests  
request --> `curl -X POST "http://localhost:3002/rpc" -H "accept: application/json" -H "Content-Type: application/json" -d '[{"jsonrpc": "2.0", "method": "example", "params": 2}, { "jsonrpc": "2.0", "method": "test" }]'`  
response <-- `[{"jsonrpc":"2.0","result":2,"id":null},{"jsonrpc":"2.0","id":null}]`
