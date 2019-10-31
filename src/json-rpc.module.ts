import { DynamicModule, Inject, Module, OnModuleInit, Provider } from '@nestjs/common';
import { HttpAdapterHost, ModulesContainer } from '@nestjs/core';
import { JsonRpcServer } from './json-rpc-server';
import { JsonRpcExplorer, RpcHandlerInfo } from './json-rpc-explorer';
import { JsonRpcOptionsFactory } from './interfaces/json-rpc-options-factory';
import { JsonRpcConfig } from './interfaces/json-rpc-config';
import { JsonRpcModuleAsyncOptions } from './interfaces/json-rpc-module-async-options';

const JSON_RPC_OPTIONS = '__JSON_RPC_OPTIONS__';

@Module({})
export class JsonRpcModule implements OnModuleInit {
    constructor(
        private httpAdapterHost: HttpAdapterHost,
        private rpcServer: JsonRpcServer,
        private rpcExplorer: JsonRpcExplorer,
        @Inject(JSON_RPC_OPTIONS) private config: JsonRpcConfig,
        private modulesContainer: ModulesContainer,
    ) {
    }

    public static forRoot(config: JsonRpcConfig): DynamicModule {
        return {
            module: JsonRpcModule,
            imports: [],
            providers: [
                {
                    provide: JSON_RPC_OPTIONS,
                    useValue: config,
                },
                JsonRpcServer,
                JsonRpcExplorer,
            ],
            exports: [],
            controllers: [],
        };
    }

    public static forRootAsync(options: JsonRpcModuleAsyncOptions): DynamicModule {
        return {
            module: JsonRpcModule,
            imports: options.imports || [],
            providers: [
                JsonRpcServer,
                JsonRpcExplorer,
                ...this.createAsyncProvider(options),
            ],
        };
    }

    private static createAsyncProvider(options: JsonRpcModuleAsyncOptions): Provider[] {
        if (options.useExisting || options.useFactory) {
            return [this.createAsyncOptionsProvider(options)];
        }
        return [
            this.createAsyncOptionsProvider(options),
            {
                provide: options.useClass,
                useClass: options.useClass,
            },
        ];
    }

    private static createAsyncOptionsProvider(options: JsonRpcModuleAsyncOptions): Provider {
        if (options.useFactory) {
            return {
                provide: JSON_RPC_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
        }
        return {
            provide: JSON_RPC_OPTIONS,
            useFactory: async (optionsFactory: JsonRpcOptionsFactory) =>
                await optionsFactory.createJsonRpcOptions(),
            inject: [options.useExisting || options.useClass],
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
        const { httpAdapter } = this.httpAdapterHost;
        this.rpcServer.run(
            httpAdapter,
            handlers,
            this.config,
        );
    }
}
