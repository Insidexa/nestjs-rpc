import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { JsonRpcModule, RpcHandler, RpcId, RpcMethod, RpcPayload, RpcVersion, IRpcHandler } from '../src';

@RpcHandler({
  method: 'test',
})
export class TestHandler implements IRpcHandler<any> {
  public async invoke(
      @RpcPayload() payload: any,
      @RpcVersion() version: string,
      @RpcMethod() method: string,
      @RpcId() id: any,
  ) {
    return payload;
  }
}

describe('Test json rpc specification', () => {
  let app;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        JsonRpcModule.forRoot({
          path: '/rpc',
        }),
      ],
      providers: [TestHandler],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('positive', () => {
    it('should return correct json rpc structure', async () => {
      const { body } = await request(app.getHttpServer())
          .post('/rpc')
          .send({ jsonrpc: '2.0', id: 1, params: { field: 1 }, method: 'test' })
          .expect(200);

      const keys = Object.keys(body);
      expect(keys.sort()).toEqual(['id', 'jsonrpc', 'result'].sort());
    });

    it('notification', async () => {
      await request(app.getHttpServer())
          .post('/rpc')
          .send({ jsonrpc: '2.0', params: { field: 1 }, method: 'test' })
          .expect(200)
          .expect('');
    });

    it('should return id', async () => {
      const { body } = await request(app.getHttpServer())
          .post('/rpc')
          .send({ jsonrpc: '2.0', id: 1, params: { field: 1 }, method: 'test' })
          .expect(200);

      expect(body.id).toEqual(1);
    });

    it('should return result', async () => {
      const { body } = await request(app.getHttpServer())
          .post('/rpc')
          .send({ jsonrpc: '2.0', id: 1, params: { field: 1 }, method: 'test' })
          .expect(200);

      expect(body.result).toEqual({ field: 1 });
    });

    it('should skip notification response in batch request', async () => {
      const { body } = await request(app.getHttpServer())
          .post('/rpc')
          .send([
            { jsonrpc: '2.0', id: 1, params: { field: 1 }, method: 'test' },
            { jsonrpc: '2.0', params: { field: 1 }, method: 'test' },
          ])
          .expect(200);

      expect(body).toEqual([
        { jsonrpc: '2.0', id: 1, result: { field: 1 } },
      ]);
    });

    it('should return empty response in batch request when all notifications', async () => {
      const { body } = await request(app.getHttpServer())
          .post('/rpc')
          .send([
            { jsonrpc: '2.0', params: { field: 1 }, method: 'test' },
            { jsonrpc: '2.0', params: { field: 1 }, method: 'test' },
          ])
          .expect(200);

      expect(body).toEqual('');
    });
  });

  describe('negative', () => {
    it('should return correct error structure', async () => {
      const { body } = await request(app.getHttpServer())
          .post('/rpc')
          .send({ jsonrpc: '2.0', id: 1, params: { field: 1 }, method: 'some-method' })
          .expect(200);

      const keys = Object.keys(body);
      expect(keys.sort()).toEqual(['jsonrpc', 'error', 'id'].sort());
    });

    it('should return invalid request', async () => {
      const { body } = await request(app.getHttpServer())
          .post('/rpc')
          .send({ id: 1, params: { field: 1 }, method: 'test' })
          .expect(200);

      expect(body).toEqual({
        jsonrpc: '2.0',
        error: {code: -32600, message: 'Invalid request'},
        id: 1,
      });
    });

    it('should return non-existent method exception', async () => {
      const { body } = await request(app.getHttpServer())
          .post('/rpc')
          .send({ jsonrpc: '2.0', id: 1, params: { field: 1 }, method: 'some-method' })
          .expect(200);
      expect(body).toEqual({
        jsonrpc: '2.0',
        error: {code: -32601, message: 'Method not found'},
        id: 1,
      });
    });

    it('should return invalid request when empty batch', async () => {
      const { body } = await request(app.getHttpServer())
          .post('/rpc')
          .send([])
          .expect(200);
      expect(body).toEqual({
        jsonrpc: '2.0',
        error: {code: -32600, message: 'Invalid request'},
        id: null,
      });
    });

    it('should return invalid request when batch invalid', async () => {
      const { body } = await request(app.getHttpServer())
          .post('/rpc')
          .send([{}, 1, 1])
          .expect(200);

      for (const item of body) {
        expect(item).toEqual({
          jsonrpc: '2.0',
          error: {code: -32600, message: 'Invalid request'},
          id: null,
        });
      }
    });
  });
});
