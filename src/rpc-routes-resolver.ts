import { MODULE_PATH } from '@nestjs/common/constants';
import { HttpServer, Type } from '@nestjs/common/interfaces';
import { Logger } from '@nestjs/common/services/logger.service';
import { Resolver } from '@nestjs/core/router/interfaces/resolver.interface';
import { ApplicationConfig, NestContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Injector } from '@nestjs/core/injector/injector';
import { IRpcHandler, JsonRpcConfig } from './interfaces';
import { JsonRpcExplorer } from './json-rpc-explorer';
import { RouterProxyCallback } from '@nestjs/core/router/router-proxy';
import { RpcMetadataKey } from './index';
import { RpcCallbackProxy } from './rpc-callback-proxy';
import { ProxyCallback } from './types';

export const RPC_MAPPING_MESSAGE = (name: string, path: string) =>
    `Registered ${name} {${path}}:`;

export interface RpcProxyHandler {
    proxy: ProxyCallback;
    method: string;
}

export class RpcRoutesResolver implements Resolver {
    private readonly logger = new Logger(RpcRoutesResolver.name, true);
    private rpcCallbackProxy: RpcCallbackProxy;

    constructor(
        private readonly container: NestContainer,
        private readonly config: ApplicationConfig,
        private readonly injector: Injector,
        private readonly rpcConfig: JsonRpcConfig,
    ) {
        this.rpcCallbackProxy = new RpcCallbackProxy(
            this.config,
            this.container,
            this.injector,
        );
    }

    public resolve<T extends HttpServer>(applicationRef: T, basePath: string): Map<string, RouterProxyCallback> {
        const modules = this.container.getModules();
        const handlers = new Map<string, RouterProxyCallback>();
        modules.forEach(({ providers, metatype }, moduleName) => {
            let path = metatype ? this.getModulePathMetadata(metatype) : undefined;
            path = path ? basePath + path : basePath;
            const rpcHandlers = JsonRpcExplorer.exploreProviders(providers);
            const moduleRpcProxies = this.registerRouters(rpcHandlers, moduleName, path);
            moduleRpcProxies.forEach(({ method, proxy }) => handlers.set(method, proxy))
        });

        return handlers;
    }

    public registerRouters(
        routes: InstanceWrapper<IRpcHandler>[],
        moduleKey: string,
        basePath: string,
    ): RpcProxyHandler[] {
        const methodName = 'invoke';
        const path = basePath + this.rpcConfig.path;
        return routes.map(instanceWrapper => {
            const { metatype, instance } = instanceWrapper;

            const rpcHandlerName = metatype.name;
            this.logger.log(
                RPC_MAPPING_MESSAGE(
                    rpcHandlerName,
                    path,
                ),
            );

            const proxy = this.rpcCallbackProxy.create(
                instanceWrapper,
                moduleKey,
                methodName,
            );
            const { method } = Reflect.getMetadata(RpcMetadataKey, instance.constructor);
            return { proxy, method };
        });
    }

    // tslint:disable-next-line:no-empty
    public registerNotFoundHandler() {
    }

    // tslint:disable-next-line:no-empty
    public registerExceptionHandler() {
    }

    private getModulePathMetadata(metatype: Type<unknown>): string | undefined {
        return Reflect.getMetadata(MODULE_PATH, metatype);
    }
}
