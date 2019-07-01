import { Injectable } from '@nestjs/common';
import { AbstractHttpAdapter, ModuleRef } from '@nestjs/core';
import { RpcConfig } from './rpc.module';
import { Request } from 'express';
import { RpcHandlerInfo } from './rpc-explorer';
import { isEqual, sortBy } from 'lodash';
import { RpcProxy } from './context/rpc-proxy';
import { PipesContextCreator } from '@nestjs/core/pipes/pipes-context-creator';
import { PipesConsumer } from '@nestjs/core/pipes/pipes-consumer';
import { GuardsContextCreator } from '@nestjs/core/guards/guards-context-creator';
import { GuardsConsumer } from '@nestjs/core/guards/guards-consumer';
import { InterceptorsContextCreator } from '@nestjs/core/interceptors/interceptors-context-creator';
import { InterceptorsConsumer } from '@nestjs/core/interceptors/interceptors-consumer';
import { from as fromPromise, Observable, of, } from 'rxjs';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import { catchError, combineAll, map, switchMap, tap } from 'rxjs/operators';
import { RouteParamsFactory } from '@nestjs/core/router/route-params-factory';
import { RouterExceptionFilters } from '@nestjs/core/router/router-exception-filters';
import { RpcContextCreator } from './context/rpc-context-creator';
import { ServerResponse } from 'http';

enum RPC_ERRORS {
    // Invalid JSON was received by the server.
    // An error occurred on the server while parsing the JSON text.
    PARSE_ERROR = -32700,

    // The JSON sent is not a valid Request object.
    INVALID_REQUEST = -32600,

    // The method does not exist / is not available.
    METHOD_NOT_FOUND = -32601,

    // Invalid method parameter(s).
    INVALID_PARAMS = -32602,

    // Internal JSON-RPC error.
    INTERNAL_ERROR = -32603,
}

export class RpcException extends Error {
    public readonly message: any;

    constructor(
        message: string | object,
        private readonly code: number,
    ) {
        super();
        this.message = message;
    }

    public getStatus(): number {
        return this.code;
    }
}

interface RpcRequest {
    jsonrpc: string;
    params?: any;
    id?: number | string | null | undefined;
    method: string;
}

@Injectable()
export class RpcServer {
    private needKeys = ['jsonrpc', 'method'];
    private handlers = new Map<string, any>();
    private executionContextCreator: RpcContextCreator;
    private exceptionsFilter: RouterExceptionFilters;
    private routerProxy = new RpcProxy();

    constructor(
        private moduleRef: ModuleRef,
    ) {
        const module = moduleRef as any;
        const container = module.container;
        const config = module.container.applicationConfig;
        this.executionContextCreator = new RpcContextCreator(
            new RouteParamsFactory(),
            new PipesContextCreator(container, config),
            new PipesConsumer(),
            new GuardsContextCreator(container, config),
            new GuardsConsumer(),
            new InterceptorsContextCreator(container, config),
            new InterceptorsConsumer(),
            container.getHttpAdapterRef(),
        );
        this.exceptionsFilter = new RouterExceptionFilters(
            container,
            config,
            container.getHttpAdapterRef(),
        );
    }

    public run(
        httpAdapter: AbstractHttpAdapter,
        handlers: RpcHandlerInfo[],
        config: RpcConfig,
    ) {
        for (const {instance, id, method} of handlers) {
            const executionContext = this.executionContextCreator.create(
                instance,
                instance.invoke,
                'invoke',
                id,
            );
            const exceptionFilter = this.exceptionsFilter.create(
                instance,
                instance.invoke,
                id,
            );
            const proxy = this.routerProxy.createProxy(executionContext, exceptionFilter);
            this.handlers.set(method, proxy);
        }

        const httpInstance = httpAdapter.getInstance();
        httpInstance.post(config.path, this.onRequest.bind(this));
    }

    private async onRequest(request: Request, response: ServerResponse, next) {
        if (Array.isArray(request.body)) {
            of<RpcRequest>(...request.body)
                .pipe(
                    map(body => this.lifecycleRpc({...request, body}, response, next)),
                    combineAll(),
                )
                .subscribe(
                    result => this.sendResponse(response, result),
                );
        } else {
            this.lifecycleRpc(request, response, next)
                .subscribe(
                    result => this.sendResponse(response, result),
                );
        }
    }

    private sendResponse(response, result) {
        response.statusCode = 200;
        response.end(JSON.stringify(result));
    }

    public transformToObservable<T = any>(resultOrDeffered: any): Observable<T> {
        if (resultOrDeffered instanceof Promise) {
            return fromPromise(resultOrDeffered);
        } else if (!this.isObservable(resultOrDeffered)) {
            return of(resultOrDeffered);
        }
        return resultOrDeffered;
    }

    private lifecycleRpc(request, response, next) {
        return this.transformToObservable(request.body)
            .pipe(
                tap(body => this.assertRPCStructure(body)),
                tap(body => {
                    if (this.handlers.has(body.method) === false) {
                        throw new RpcException('Method not found', RPC_ERRORS.METHOD_NOT_FOUND);
                    }
                }),
                switchMap(body => {
                    const result = this.handlers.get(body.method)(request, response, next);
                    if (result instanceof Promise) {
                        return fromPromise(result);
                    }

                    if (!this.isObservable(result)) {
                        return of(result);
                    }

                    return result;
                }),
                catchError(err => of(err)),
                map(result => {
                    const id = request.body.id;
                    if (result instanceof RpcException) {
                        return this.wrapRPCError(result, id)
                    }
                    return this.wrapRPCResponse(result, id);
                }),
                // finalize(() => console.log('finalyze')),
            );
    }

    private isObservable(input: unknown): input is Observable<any> {
        return input && isFunction((input as Observable<any>).subscribe);
    }

    private wrapRPCResponse(result, id: number = null) {
        return {jsonrpc: '2.0', result, id};
    }

    private wrapRPCError(error, id: number = null) {
        return {jsonrpc: '2.0', error, id};
    }

    private assertRPCStructure(body: any) {
        if (Array.isArray(body)) {
            for (const operation of body) {
                this.assertStructure(operation);
            }
        } else {
            this.assertStructure(body);
        }

        return body;
    }

    private assertStructure(operation: any) {
        const keys = Object.keys(operation).filter(key => {
            return !['params', 'id'].includes(key);
        });
        const isValidStructure = isEqual(sortBy(this.needKeys), sortBy(keys));

        if (isValidStructure) {
            return true;
        }

        throw new RpcException('Invalid JSON-RPC', RPC_ERRORS.INVALID_REQUEST);
    }
}
