import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { JsonRpcModule } from '../src';
import { CustomHeaderHandler } from './handlers/custom-header';

describe('Test json rpc custom headers', () => {
  let app;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        JsonRpcModule.forRoot({
          path: '/rpc',
        }),
      ],
      providers: [CustomHeaderHandler],
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

      expect(handlerNameHeader).toEqual(CustomHeaderHandler.name);
    });
  });
});
