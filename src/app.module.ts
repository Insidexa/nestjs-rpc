import { Module } from '@nestjs/common';
import { RpcModule } from './rpc/rpc.module';
import {
    AuthGuard,
    HttpExceptionFilter,
    LoggingInterceptor,
    RpcExampleHandler,
    ValidationPipe,
} from './rpc-example-handler';
import { TestHandler } from './test-handler';

@Module({
    imports: [
        RpcModule.forRoot({
            path: '/rpc',
        }),
    ],
    providers: [
        RpcExampleHandler,
        TestHandler,
        AuthGuard,
        LoggingInterceptor,
        ValidationPipe,
        HttpExceptionFilter,
    ],
})
export class AppModule {
}
