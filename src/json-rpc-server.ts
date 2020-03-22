import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationConfig, HttpAdapterHost, ModuleRef, NestContainer } from '@nestjs/core';
import { isEqual, sortBy } from 'lodash';
import { JsonRpcProxy, RouterProxyCallback } from './context/json-rpc-proxy';
import { PipesContextCreator } from '@nestjs/core/pipes/pipes-context-creator';
import { PipesConsumer } from '@nestjs/core/pipes/pipes-consumer';
import { GuardsContextCreator } from '@nestjs/core/guards/guards-context-creator';
import { GuardsConsumer } from '@nestjs/core/guards/guards-consumer';
import { InterceptorsContextCreator } from '@nestjs/core/interceptors/interceptors-context-creator';
import { InterceptorsConsumer } from '@nestjs/core/interceptors/interceptors-consumer';
import { forkJoin, from as fromPromise, Observable, of } from 'rxjs';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { RouteParamsFactory } from '@nestjs/core/router/route-params-factory';
import { RouterExceptionFilters } from '@nestjs/core/router/router-exception-filters';
import { JsonRpcContextCreator } from './context/json-rpc-context-creator';
import { RpcException } from './exception/json-rpc.exception';
import { RpcInvalidRequestException } from './exception/rpc-invalid-request.exception';
import { RpcMethodNotFoundException } from './exception/rpc-method-not-found.exception';
import {
    JsonRpcConfig,
    RpcErrorInterface,
    RpcHandlerInfo,
    RpcRequestInterface,
    RpcResultInterface,
} from './interfaces';
import { Response, RpcRequest, RpcResponse } from './types';

@Injectable()
export class JsonRpcServer {
    private needKeys = ['jsonrpc', 'method'];
    private ignoreKeys = ['params', 'id'];
    private handlers = new Map<string, RouterProxyCallback>();
    private executionContextCreator: JsonRpcContextCreator;
    private exceptionsFilter: RouterExceptionFilters;
    private routerProxy = new JsonRpcProxy();

    constructor(
        private moduleRef: ModuleRef,
        private config: ApplicationConfig,
        private httpAdapterHost: HttpAdapterHost,
    ) {
        const module = moduleRef as any;
        const container = module.container as NestContainer;
        this.executionContextCreator = new JsonRpcContextCreator(
            new RouteParamsFactory(),
            new PipesContextCreator(container, this.config),
            new PipesConsumer(),
            new GuardsContextCreator(container, this.config),
            new GuardsConsumer(),
            new InterceptorsContextCreator(container, this.config),
            new InterceptorsConsumer(),
        );
        this.exceptionsFilter = new RouterExceptionFilters(
            container,
            this.config,
            container.getHttpAdapterRef(),
        );
    }

    public run(
        handlers: RpcHandlerInfo[],
        config: JsonRpcConfig,
    ) {
        for (const { instance, id, method } of handlers) {
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

        this.httpAdapterHost.httpAdapter.post(config.path, this.onRequest.bind(this));
    }

    private onRequest<TRequest extends any, TResponse = any>(request: TRequest, response: TResponse, next: () => void) {
        if (Array.isArray(request.body)) {
            this.batchRequest(request, response, next);

            return;
        }

        this.lifecycle(request, response, next).subscribe(result => {
            this.sendResponse(response, request.body.id ? result : undefined);
        });
    }

    private batchRequest<TRequest extends any, TResponse = any>(request: TRequest, response: TResponse, next: () => void) {
        const batch = request.body as RpcRequestInterface[];
        if (batch.length === 0) {
            this.sendResponse(
                response,
                this.wrapRPCError(
                    {},
                    new RpcInvalidRequestException(),
                ),
            );

            return;
        }

        const requests = batch.map(body => {
            return this.lifecycle({ ...request, body }, response, next);
        });

        forkJoin(...requests)
            .subscribe((results: Response) => {
                const responses = results.filter(result => {
                    return result && result.id !== undefined;
                });
                this.sendResponse(response, responses.length === 0 ? undefined : responses);
            });
    }

    private sendResponse(response: any, result?: RpcResponse) {
        this.httpAdapterHost.httpAdapter.setHeader(response,'Content-Type', 'application/json');
        this.httpAdapterHost.httpAdapter.reply(
            response,
            JSON.stringify(result),
            HttpStatus.OK,
        );
    }

    private lifecycle<TRequest extends any, TResponse = any>(request: TRequest, response: TResponse, next: () => void): Observable<RpcResponse> {
        return of<RpcRequestInterface>(request.body as RpcRequestInterface)
            .pipe(
                tap(body => this.assertRPCStructure(body)),
                tap(body => {
                    if (this.handlers.has(body.method) === false) {
                        throw new RpcMethodNotFoundException();
                    }
                }),
                switchMap(body => this.resolveWaitingResponse(body, request, response, next)),
                catchError(err => of(err)),
                map(result => this.resolveResponseOrNullIfNotification(result, request.body)),
            );
    }

    private resolveResponseOrNullIfNotification(result: any, body: RpcRequestInterface) {
        if ((result instanceof RpcException) === false && body.id) {
            return this.wrapRPCResponse(body, result);
        }
        if (result instanceof RpcInvalidRequestException) {
            return this.wrapRPCError(body, result);
        }

        if (body.id === undefined) {
            return null;
        }

        return this.wrapRPCError(body, result);
    }

    private resolveWaitingResponse<TRequest = any, TResponse = any>(
        body: RpcRequestInterface,
        request: TRequest,
        response: TResponse,
        next: () => void,
    ) {
        const { method, id } = body;
        if (id === undefined) {
            this.handlers.get(method)(request, response, next);
            return of(null);
        }
        const result = this.handlers.get(method)(request, response, next);
        if (result instanceof Promise) {
            return fromPromise(result);
        }

        if (!this.isObservable(result)) {
            return of(result);
        }

        return result;
    }

    private isObservable(input: unknown): input is Observable<any> {
        return input && isFunction((input as Observable<any>).subscribe);
    }

    private wrapRPCResponse({ jsonrpc, id, method }: RpcRequestInterface, result = null): RpcResultInterface {
        return {
            jsonrpc,
            result,
            ...(id && { id, result }),
            ...(id === undefined && { method }),
        };
    }

    private wrapRPCError(
        { jsonrpc = '2.0', method, id }: Partial<RpcRequestInterface>,
        error: RpcException,
    ): RpcErrorInterface {
        return {
            jsonrpc,
            error,
            ...(id === undefined && { method, id: null }),
            ...(id && { id }),
        };
    }

    private assertRPCStructure(body: RpcRequest): RpcRequest {
        if (Array.isArray(body)) {
            for (const operation of body) {
                this.assertStructure(operation);
            }
        } else {
            this.assertStructure(body);
        }

        return body;
    }

    private assertStructure(operation: RpcRequestInterface) {
        const keys = Object.keys(operation).filter(key => {
            return this.ignoreKeys.includes(key) === false;
        });
        const isValidStructure = isEqual(sortBy(this.needKeys), sortBy(keys))
            && this.isValidIdType(operation.id)
            && typeof operation.method === 'string';

        if (isValidStructure) {
            return;
        }

        throw new RpcInvalidRequestException();
    }

    private isValidIdType(id): boolean {
        const type = typeof id;
        if (type === 'undefined') {
            return true;
        }

        if (type === 'number' && Number.isInteger(id)) {
            return true;
        }

        return type === 'string' || id === null;
    }
}
