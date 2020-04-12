## NestJS JSON RPC package - [nestjs-json-rpc](https://www.npmjs.com/package/@jashkasoft/nestjs-json-rpc) npm package

![Build](https://github.com/Insidexa/nestjs-rpc/workflows/Build/badge.svg)

`npm i --save @jashkasoft/nestjs-json-rpc`

Implemented JSON RPC [specification](https://www.jsonrpc.org/specification)

How to use:
 - import module `RpcModule` from `@jashkasoft/nestjs-json-rpc`, example  
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
 - test with curl  
   ```bash
   curl -X POST "http://localhost:3000/rpc" -H "accept: application/json" -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "test", "id": 2}'
    ```


See examples in samples folder
 
Fields description

| field |  decorator |  description | required  | other  |
|---|---|---|---|---|
| `params` | `@RpcPayload()`  |  get payload ( params ) | false  |   | 
| `jsonrpc` | `@RpcVersion()` | get rpc version  | true  |   |   |
| `method` | `@RpcMethod()` | get rpc version  | true  |   |   |
| `id` | `@RpcId()`  | get client operation id  | false  | if not send - response not send, RPC notification  |


##### Changelog versions:  
`7.3.0`
 - allow response object
 - add custom headers

`7.2.0`
 - add injection scopes ( REQUEST / TRANSIENT ) to JSON RPC handlers
 - add logging register handlers
 - add injection scopes sample

`7.1.1`
 - add express engine example

`7.1.0`
 - add support fastify adapter

`7.0.0`
 - support nestjs 7.0.0
 - fix types
 - add to decorators ExecutionContext ( breaking change )
