import { AppService } from './app.service';
import { IRpcHandler, RpcHandler } from '@jashkasoft/nestjs-json-rpc';
import { Logger } from '@nestjs/common';

@RpcHandler({ method: 'hello' })
export class HelloHandler implements IRpcHandler<any> {
  constructor(private readonly appService: AppService) {
    Logger.log(`instantiate ${HelloHandler.name} on every request`);
  }

  public invoke(): string {
    return this.appService.getHello();
  }
}
