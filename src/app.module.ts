import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { RpcModule } from './rpc/rpc.module';

@Module({
  imports: [
    RpcModule.forRoot({
      path: '/rpc',
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
