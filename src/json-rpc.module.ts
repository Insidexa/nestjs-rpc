import { DynamicModule, Inject, Module, OnModuleInit, Provider } from '@nestjs/common';
import { ApplicationConfig, HttpAdapterHost, ModuleRef, NestContainer } from '@nestjs/core';
import { JsonRpcServer } from './json-rpc-server';
import { JsonRpcConfig, JsonRpcModuleAsyncOptions, JsonRpcOptionsFactory } from './index';
import { RpcRoutesResolver } from './rpc-routes-resolver';
import { Injector } from '@nestjs/core/injector/injector';
import { validatePath } from '@nestjs/common/utils/shared.utils';

const JSON_RPC_OPTIONS = '__JSON_RPC_OPTIONS__';

@Module({})
export class JsonRpcModule implements OnModuleInit {
    constructor(
        private rpcServer: JsonRpcServer,
        @Inject(JSON_RPC_OPTIONS) private config: JsonRpcConfig,
        private moduleRef: ModuleRef,
        private nestConfig: ApplicationConfig,
        private httpAdapterHost: HttpAdapterHost,
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

    public async onModuleInit() {
        const { container, injector } = (this.moduleRef as any) as {
            container: NestContainer,
            injector: Injector,
        };
        const routesResolver = new RpcRoutesResolver(
            container,
            this.nestConfig,
            injector,
            this.config,
        );
        const prefix = this.nestConfig.getGlobalPrefix();
        const basePath = validatePath(prefix);
        const rpcHandlers = routesResolver.resolve(this.httpAdapterHost.httpAdapter, basePath);
        this.rpcServer.run(rpcHandlers, this.config);
    }
}
