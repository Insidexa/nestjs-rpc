import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { JsonRpcModule } from '../src';
import { MultipleHandlers } from './handlers/multiple-handlers';
import { WithoutParentMethod } from './handlers/without-parent-method';

describe('Test json rpc multiple handlers in class', () => {
  let app;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        JsonRpcModule.forRoot({
          path: '/rpc',
        }),
      ],
      providers: [
        MultipleHandlers,
        WithoutParentMethod,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should work withoutParentMethod', async () => {
    const { body } = await request(app.getHttpServer())
        .post('/rpc')
        .send({ jsonrpc: '2.0', id: 1, params: { field: 1 }, method: 'withoutParentMethod' })
        .expect(200);

    expect(body.result).toEqual('withoutParentMethod');
  });

  it('should work multiple handlers', async () => {
    const { body } = await request(app.getHttpServer())
        .post('/rpc')
        .send([
          { jsonrpc: '2.0', id: 1, params: { field: 1 }, method: 'prefix.subMethod' },
          { jsonrpc: '2.0', id: 1, params: { field: 1 }, method: 'prefix.subMethod1' }
        ])
        .expect(200);

    expect(body.length).toEqual(2);
    expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            result: { field: 1 },
          }),
        ]),
    );
  });

  it('should work one handler of multiple handlers class', async () => {
    const { body } = await request(app.getHttpServer())
        .post('/rpc')
        .send({ jsonrpc: '2.0', id: 1, params: { field: 1 }, method: 'prefix.subMethod' })
        .expect(200);

    expect(body.result).toEqual({ field: 1 });
  });


});
