## Description

[nest json-rpc](https://github.com/Insidexa/nestjs-rpc) example usage json-rpc with fastify engine.

Install deps:  
`npm i`

Run application:  
`npm run start`

Create request:  
```bash
curl -X POST "http://localhost:3000/rpc" -H "accept: application/json" -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "hello", "id": 2}'
```

Response:  
```json
{"jsonrpc":"2.0","result":"Hello World!","id":2}
```
