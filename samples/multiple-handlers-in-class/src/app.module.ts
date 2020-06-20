import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { JsonRpcModule } from '@jashkasoft/nestjs-json-rpc';
import { HelloHandler } from './hello.handler';

@Module({
  imports: [
      JsonRpcModule.forRoot({
        path: '/rpc',
      }),
  ],
  controllers: [],
  providers: [
      AppService,
      HelloHandler,
  ],
})
export class AppModule {}
