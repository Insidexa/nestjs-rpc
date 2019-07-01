import { DynamicModule, Inject, Module, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost, ModulesContainer } from '@nestjs/core';
import { RpcServer } from './rpc-server';
import { RpcExplorer, RpcHandlerInfo } from './rpc-explorer';

export interface RpcConfig {
    path: string;
}

const RPC_CONFIG = '__RPC_CONFIG__';

@Module({})
export class RpcModule implements OnModuleInit {
    constructor(
        private httpAdapterHost: HttpAdapterHost,
        private rpcServer: RpcServer,
        private rpcExplorer: RpcExplorer,
        @Inject(RPC_CONFIG) private config: RpcConfig,
        private modulesContainer: ModulesContainer,
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
                RpcExplorer,
            ],
            exports: [],
            controllers: [],
        };
    }

    public onModuleInit() {
        const handlers: RpcHandlerInfo[] = [];
        this.modulesContainer.forEach((module, moduleKey) => {
            const moduleHandlers = this.rpcExplorer
                .exploreProviders(module.providers)
                .map(handler => ({...handler, id: moduleKey}));
            handlers.push(...moduleHandlers);
        });
        const {httpAdapter} = this.httpAdapterHost;
        this.rpcServer.run(
            httpAdapter,
            handlers,
            this.config,
        );
    }
}
