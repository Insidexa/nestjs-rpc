## Description

[nest json-rpc](https://github.com/Insidexa/nestjs-rpc) example usage json-rpc JWT.

Install deps:  
`npm i`

Run application:  
`npm run start`

Sign in:  

```bash
curl -X POST "http://localhost:3000/rpc" -H "accept: application/json" -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "signin", "params": {"login": "test", "password": "password"}, "id": 1}'
```
Response:
```json
{"jsonrpc":"2.0","result":{"user":{"id":1,"name":"Pedro"},"token":"TOKEN"},"id":1}
```



Copy from response value from `token` and insert to `token` field.  
Make request to secure route:  
```bash
curl -X POST "http://localhost:3000/rpc" -H "accept: application/json" -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "secure", "params": {"token": "TOKEN FROM RESPONSE"}, "id": 1}'
```


Response:
```json
{"jsonrpc":"2.0","result":"secure","id":1}%
```
