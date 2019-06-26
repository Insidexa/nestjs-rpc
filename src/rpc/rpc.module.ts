import { DynamicModule, Inject, Module, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { RpcServer } from './rpc-server';

export interface RpcConfig {
    path: string;
}

const RPC_CONFIG = '__RPC_CONFIG__';

@Module({})
export class RpcModule implements OnModuleInit {
    constructor(
        private httpAdapterHost: HttpAdapterHost,
        private rpcServer: RpcServer,
        @Inject(RPC_CONFIG) private config: RpcConfig,
    ) {
    }

    public static forRoot(config: RpcConfig): DynamicModule {
        return {
            module: RpcModule,
            imports: [],
            providers: [
                {
                    provide: RPC_CONFIG,
                    useValue: config,
                },
                RpcServer,
            ],
            exports: [],
            controllers: [],
        };
    }

    public onModuleInit() {
        const { httpAdapter } = this.httpAdapterHost;
        this.rpcServer.run(
            httpAdapter,
            this.config,
        );
    }
}
