import { Test, TestingModule } from '@nestjs/testing';
import { HelloHandler } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: HelloHandler;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HelloHandler],
      providers: [AppService],
    }).compile();

    appController = app.get<HelloHandler>(HelloHandler);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
