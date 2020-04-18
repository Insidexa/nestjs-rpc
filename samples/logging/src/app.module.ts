import { Inject, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppService } from './app.service';
import { JsonRpcModule, JsonRpcConfig, JSON_RPC_OPTIONS } from '@jashkasoft/nestjs-json-rpc';
import { HelloHandler } from './hello.handler';
import { RpcLoggingMiddleware } from './rpc-logging.middleware';

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
export class AppModule implements NestModule {
    constructor(
        @Inject(JSON_RPC_OPTIONS) private config: JsonRpcConfig
    ) {
    }

    public configure(consumer: MiddlewareConsumer): any {
        consumer
            .apply(RpcLoggingMiddleware)
            .forRoutes(this.config.path);
    }
}
