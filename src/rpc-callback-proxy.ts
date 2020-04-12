import { IRpcHandler } from './interfaces';
import { RouterProxyCallback } from '@nestjs/core/router/router-proxy';
import { STATIC_CONTEXT } from '@nestjs/core/injector/constants';
import { ContextId, InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { ApplicationConfig, ContextIdFactory, NestContainer } from '@nestjs/core';
import { REQUEST_CONTEXT_ID } from '@nestjs/core/router/request/request-constants';
import { JsonRpcProxy } from './context/json-rpc-proxy';
import { JsonRpcContextCreator } from './context/json-rpc-context-creator';
import { RouterExceptionFilters } from '@nestjs/core/router/router-exception-filters';
import { RouteParamsFactory } from '@nestjs/core/router/route-params-factory';
import { PipesContextCreator } from '@nestjs/core/pipes/pipes-context-creator';
import { PipesConsumer } from '@nestjs/core/pipes/pipes-consumer';
import { GuardsContextCreator } from '@nestjs/core/guards/guards-context-creator';
import { GuardsConsumer } from '@nestjs/core/guards/guards-consumer';
import { InterceptorsContextCreator } from '@nestjs/core/interceptors/interceptors-context-creator';
import { InterceptorsConsumer } from '@nestjs/core/interceptors/interceptors-consumer';
import { Injector } from '@nestjs/core/injector/injector';
import { ProxyCallback } from './types';

export class RpcCallbackProxy {
    private readonly routerProxy = new JsonRpcProxy();
    private readonly exceptionFiltersCache = new WeakMap();
    private readonly executionContextCreator: JsonRpcContextCreator;
    private readonly exceptionsFilter: RouterExceptionFilters;

    constructor(
        private readonly config: ApplicationConfig,
        private readonly container: NestContainer,
        private readonly injector: Injector,
    ) {
        const httpAdapterRef = container.getHttpAdapterRef();
        this.executionContextCreator = new JsonRpcContextCreator(
            new RouteParamsFactory(),
            new PipesContextCreator(container, this.config),
            new PipesConsumer(),
            new GuardsContextCreator(container, this.config),
            new GuardsConsumer(),
            new InterceptorsContextCreator(container, this.config),
            new InterceptorsConsumer(),
            httpAdapterRef,
        );
        this.exceptionsFilter = new RouterExceptionFilters(
            container,
            this.config,
            httpAdapterRef,
        );
    }

    public create(
        instanceWrapper: InstanceWrapper<IRpcHandler>,
        moduleKey: string,
        methodName: string
    ) {
        const { instance } = instanceWrapper;
        const isRequestScoped = !instanceWrapper.isDependencyTreeStatic();

        return isRequestScoped
            ? this.createRequestScopedHandler(
                instanceWrapper,
                this.container.getModuleByKey(moduleKey),
                moduleKey,
                methodName,
            )
            : this.createCallbackProxy(
                instance,
                instance.invoke,
                methodName,
                moduleKey,
            );
    }

    private createCallbackProxy(
        instance: IRpcHandler,
        callback: RouterProxyCallback,
        methodName: string,
        moduleRef: string,
        contextId = STATIC_CONTEXT,
        inquirerId?: string,
    ): ProxyCallback {
        const executionContext = this.executionContextCreator.create(
            instance,
            callback,
            methodName,
            moduleRef,
            contextId,
            inquirerId,
        );
        const exceptionFilter = this.exceptionsFilter.create(
            instance,
            callback,
            moduleRef,
            contextId,
            inquirerId,
        );
        return this.routerProxy.createProxy(executionContext, exceptionFilter);
    }

    public createRequestScopedHandler(
        instanceWrapper: InstanceWrapper,
        moduleRef: Module,
        moduleKey: string,
        methodName: string,
    ) {
        const { instance } = instanceWrapper;
        const collection = moduleRef.providers;
        return async <TRequest extends Record<any, any>, TResponse>(
            req: TRequest,
            res: TResponse,
            next: () => void,
        ) => {
            try {
                const contextId = this.getContextId(req);
                const contextInstance = await this.injector.loadPerContext(
                    instance,
                    moduleRef,
                    collection,
                    contextId,
                    instanceWrapper
                );
                return await this.createCallbackProxy(
                    contextInstance,
                    contextInstance[methodName],
                    methodName,
                    moduleKey,
                    contextId,
                    instanceWrapper.id,
                )(req, res, next);
            } catch (err) {
                let exceptionFilter = this.exceptionFiltersCache.get(
                    instance[methodName],
                );
                if (!exceptionFilter) {
                    exceptionFilter = this.exceptionsFilter.create(
                        instance,
                        instance[methodName],
                        moduleKey,
                    );
                    this.exceptionFiltersCache.set(instance[methodName], exceptionFilter);
                }
                const host = new ExecutionContextHost([req, res, next]);
                exceptionFilter.next(err, host);
            }
        };
    }

    private getContextId<T extends Record<any, unknown> = any>(
        request: T,
    ): ContextId {
        const contextId = ContextIdFactory.getByRequest(request);
        if (!request[REQUEST_CONTEXT_ID as any]) {
            Object.defineProperty(request, REQUEST_CONTEXT_ID, {
                value: contextId,
                enumerable: false,
                writable: false,
                configurable: false,
            });
            this.container.registerRequestProvider(request, contextId);
        }
        return contextId;
    }
}
