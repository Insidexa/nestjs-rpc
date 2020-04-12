import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { JsonRpcModule, RpcHandler, RpcId, RpcMethod, RpcPayload, RpcVersion, IRpcHandler } from '../src';
import { Header } from '@nestjs/common';

@RpcHandler({
  method: 'test',
})
export class TestHandler implements IRpcHandler<any> {
  @Header('Handler-Name', TestHandler.name)
  public async invoke(
      @RpcPayload() payload: any,
      @RpcVersion() version: string,
      @RpcMethod() method: string,
      @RpcId() id: any,
  ) {
    return payload;
  }
}

describe('Test json rpc custom headers', () => {
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
    it('has single custom header', async () => {
      const { header } = await request(app.getHttpServer())
          .post('/rpc')
          .send({ jsonrpc: '2.0', id: 1, params: { field: 1 }, method: 'test' })
          .expect(200);

      const handlerNameHeader = header['handler-name'];

      expect(handlerNameHeader).not.toBeUndefined();
    });

    it('custom header contains expected value', async () => {
      const { header } = await request(app.getHttpServer())
          .post('/rpc')
          .send({ jsonrpc: '2.0', id: 1, params: { field: 1 }, method: 'test' })
          .expect(200);

      const handlerNameHeader = header['handler-name'];

      expect(handlerNameHeader).toEqual(TestHandler.name);
    });
  });
});
