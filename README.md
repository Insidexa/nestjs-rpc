# NestJS JSON RPC package - [nestjs-json-rpc](https://www.npmjs.com/package/@jashkasoft/nestjs-json-rpc) npm package

![Build](https://github.com/Insidexa/nestjs-rpc/workflows/Build/badge.svg)

Implemented JSON RPC [specification](https://www.jsonrpc.org/specification)


## Contents

- [Install](#install)
- [Import module](#import-module)
- [How to use simple handler](#how-to-use-simple-handler)
    - [Create handler](#create-simple-handler)
    - [Add to providers](#add-simple-handler-provider)
    - [Test with curl](#test-simple-handler-curl)
- [How to use multiple handlers in one class](#multi-handlers-in-class)
    - [Create handlers](#create-multiple-handlers)
    - [Add to providers](#add-multiple-handler-provider)
    - [Test with curl](#test-multiple-handler-curl)
- [Decorators description](#decorators-description)
- [Samples](#samples)
- [Changelog](#changelog)


### <a id="install"></a> Install

   `npm i --save @jashkasoft/nestjs-json-rpc`

### <a id="import-module"></a> Import module

Import module `RpcModule` from `@jashkasoft/nestjs-json-rpc`, example  

```typescript
        JsonRpcModule.forRoot({
            path: '/rpc', // path to RPC
        })
```

### <a id="how-to-use-simple-handler"></a> How to use simple handler

Create simple RPC handler

#### <a id="create-simple-handler"></a> Create handler

create RPC handler  

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


#### <a id="add-simple-handler-provider"></a> Add to providers

Add `TestHandler` to providers array  

 
#### <a id="test-simple-handler-curl"></a> Test with cURL

Every request to RPC is POST method and response status = 200  

Test with curl  

```bash
curl -X POST "http://localhost:3000/rpc" -H "accept: application/json" -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "test", "id": 2}'
```
    
    

### <a id="multi-handlers-in-class"></a> How to use multiple handlers in one class

Create multiple RPC handler in one class  

#### <a id="create-multiple-handlers"></a> Create handlers

Create RPC class handler  

```typescript
import { RpcId, RpcPayload, RpcVersion, RpcMethod, RpcMethodHandler, RpcHandler } from '@jashkasoft/nestjs-json-rpc';

@RpcHandler({
    method: 'contact',
})
export class ContactHandler {
    @RpcMethodHandler('add')
    public async add(
        @RpcPayload() payload: Payload,
        @RpcVersion() version: string,
        @RpcId() id: number | string,
        @RpcMethod() method: string
    ) {
        return payload;
    }
    
    @RpcMethodHandler('delete')
    public async delete(
        @RpcPayload() payload: Payload,
        @RpcVersion() version: string,
        @RpcId() id: number | string,
        @RpcMethod() method: string
    ) {
        return payload;
    }
}
```


#### <a id="add-multiple-handler-provider"></a> Add to providers

Add `ContactHandler` to providers array  

 
#### <a id="test-multiple-handler-curl"></a> Test with cURL

Every request to RPC is POST method and response status = 200  

Test with curl `contact.add`  

```bash
curl -X POST "http://localhost:3000/rpc" -H "accept: application/json" -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "contact.add", "id": 2}'
```
    

Test with curl `contact.delete`  

```bash
curl -X POST "http://localhost:3000/rpc" -H "accept: application/json" -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "contact.delete", "id": 2}'
```


### Decorators description

| field |  decorator |  description | required  | other  |
|---|---|---|---|---|
| `params` | `@RpcPayload()`  |  get payload ( params ) | false  | use pipes...  | 
| `jsonrpc` | `@RpcVersion()` | get rpc version  | true  | use pipes...  |  
| `method` | `@RpcMethod()` | get rpc version  | true  | use pipes...  |  
| `id` | `@RpcId()`  | get client operation id  | false  | if not send - response not send, RPC notification. use pipes...  |


### Samples
See examples in samples folder


### Changelog:  

`7.5.0`
 - add multiple RPC handlers for class
 - NestJS 7.2.*

`7.4.0`
 - fix types for `JsonRpcModule` async options
 - export `JSON_RPC_OPTIONS`.  
   You can inject rpc config:  
   `@Inject(JSON_RPC_OPTIONS) private config: JsonRpcConfig`

`7.3.2`
 - decrease bundle size

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
