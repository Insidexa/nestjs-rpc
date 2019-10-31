import { Controller, PipeTransform } from '@nestjs/common/interfaces';
import { GuardsConsumer } from '@nestjs/core/guards/guards-consumer';
import { GuardsContextCreator } from '@nestjs/core/guards/guards-context-creator';
import { InterceptorsConsumer } from '@nestjs/core/interceptors/interceptors-consumer';
import { InterceptorsContextCreator } from '@nestjs/core/interceptors/interceptors-context-creator';
import { PipesConsumer } from '@nestjs/core/pipes/pipes-consumer';
import { PipesContextCreator } from '@nestjs/core/pipes/pipes-context-creator';
import { IRouteParamsFactory } from '@nestjs/core/router/interfaces/route-params-factory.interface';
import { HandlerMetadata, HandlerMetadataStorage } from '@nestjs/core/helpers/handler-metadata-storage';
import { ContextUtils } from '@nestjs/core/helpers/context-utils';
import { ForbiddenException, RouteParamMetadata } from '@nestjs/common';
import { STATIC_CONTEXT } from '@nestjs/core/injector/constants';
import { CUSTOM_ROUTE_AGRS_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { isFunction, isString } from '@nestjs/common/utils/shared.utils';
import { FORBIDDEN_MESSAGE } from '@nestjs/core/guards/constants';
import { ParamProperties } from '@nestjs/core/router/router-execution-context';

type Fn = (...args) => any;
const response = null;

export class JsonRpcContextCreator {
    private readonly handlerMetadataStorage = new HandlerMetadataStorage();
    private readonly contextUtils = new ContextUtils();

    constructor(
        private readonly paramsFactory: IRouteParamsFactory,
        private readonly pipesContextCreator: PipesContextCreator,
        private readonly pipesConsumer: PipesConsumer,
        private readonly guardsContextCreator: GuardsContextCreator,
        private readonly guardsConsumer: GuardsConsumer,
        private readonly interceptorsContextCreator: InterceptorsContextCreator,
        private readonly interceptorsConsumer: InterceptorsConsumer,
    ) {
    }

    public create(
        instance: Controller,
        callback: (...args: any[]) => any,
        methodName: string,
        module: string,
        contextId = STATIC_CONTEXT,
        inquirerId?: string,
    ) {
        const {
            argsLength,
            fnHandleResponse,
            paramtypes,
            getParamsMetadata,
        } = this.getMetadata(instance, callback, methodName);

        const paramsOptions = this.contextUtils.mergeParamsMetatypes(
            getParamsMetadata(module, contextId, inquirerId),
            paramtypes,
        );
        const pipes = this.pipesContextCreator.create(
            instance,
            callback,
            module,
            contextId,
            inquirerId,
        );
        const guards = this.guardsContextCreator.create(
            instance,
            callback,
            module,
            contextId,
            inquirerId,
        );
        const interceptors = this.interceptorsContextCreator.create(
            instance,
            callback,
            module,
            contextId,
            inquirerId,
        );

        const fnCanActivate = this.createGuardsFn(guards, instance, callback);
        const fnApplyPipes = this.createPipesFn(pipes, paramsOptions);

        const handler = <TRequest, TResponse>(
            args: any[],
            req: TRequest,
            res: TResponse,
            next: Fn,
        ) => async () => {
            if (fnApplyPipes) {
                await fnApplyPipes(args, req, res, next);
            }
            return callback.apply(instance, args);
        };

        return async <TRequest, TResponse>(
            req: TRequest,
            res: TResponse,
            next: Fn,
        ) => {
            const args = this.contextUtils.createNullArray(argsLength);
            if (fnCanActivate) {
                await fnCanActivate([ req, response ]);
            }

            const result = await this.interceptorsConsumer.intercept(
                interceptors,
                [ req, response ],
                instance,
                callback,
                handler(args, req, res, next),
            );

            return await fnHandleResponse(result, res);
        };
    }

    public getMetadata(
        instance: Controller,
        callback: (...args: any[]) => any,
        methodName: string,
    ): HandlerMetadata {
        const cacheMetadata = this.handlerMetadataStorage.get(instance, methodName);
        if (cacheMetadata) {
            return cacheMetadata;
        }
        const metadata =
            this.contextUtils.reflectCallbackMetadata(
                instance,
                methodName,
                ROUTE_ARGS_METADATA,
            ) || {};
        const keys = Object.keys(metadata);
        const argsLength = this.contextUtils.getArgumentsLength(keys, metadata);
        const paramtypes = this.contextUtils.reflectCallbackParamtypes(
            instance,
            methodName,
        );
        const getParamsMetadata = (
            moduleKey: string,
            contextId = STATIC_CONTEXT,
            inquirerId?: string,
        ) =>
            this.exchangeKeysForValues(
                keys,
                metadata,
                moduleKey,
                contextId,
                inquirerId,
            );

        const fnHandleResponse = this.createHandleResponseFn();

        const handlerMetadata: HandlerMetadata = {
            argsLength,
            fnHandleResponse,
            paramtypes,
            getParamsMetadata,
            httpStatusCode: 200,
            hasCustomHeaders: false,
            responseHeaders: [],
        };
        this.handlerMetadataStorage.set(instance, methodName, handlerMetadata);
        return handlerMetadata;
    }

    public exchangeKeysForValues(
        keys: string[],
        metadata: RouteParamMetadata,
        moduleContext: string,
        contextId = STATIC_CONTEXT,
        inquirerId?: string,
    ): ParamProperties[] {
        this.pipesContextCreator.setModuleContext(moduleContext);
        return keys.map(key => {
            const { index, data, pipes: pipesCollection } = metadata[key];
            const pipes = this.pipesContextCreator.createConcreteContext(
                pipesCollection,
                contextId,
                inquirerId,
            );
            const type = this.contextUtils.mapParamType(key);

            if (key.includes(CUSTOM_ROUTE_AGRS_METADATA)) {
                const { factory } = metadata[key];
                const customExtractValue = this.getCustomFactory(factory, data);
                return { index, extractValue: customExtractValue, type, data, pipes };
            }
            const numericType = Number(type);
            const extractValue = <TRequest, TResponse>(
                req: TRequest,
                res: TResponse,
                next: Fn,
            ) =>
                this.paramsFactory.exchangeKeyForValue(numericType, data, {
                    req,
                    res: response,
                    next,
                });
            return { index, extractValue, type: numericType, data, pipes };
        });
    }

    public getCustomFactory(
        factory: (...args: any[]) => void,
        data: any,
    ): (...args: any[]) => any {
        return isFunction(factory)
            ? (req, res, next) => factory(data, req)
            : () => null;
    }

    public async getParamValue<T>(
        value: T,
        {
            metatype,
            type,
            data,
        }: { metatype: any; type: RouteParamtypes; data: any },
        transforms: Array<PipeTransform<any>>,
    ): Promise<any> {
        if (type === RouteParamtypes.BODY || isString(type)) {
            return this.pipesConsumer.apply(
                value,
                { metatype, type, data } as any,
                transforms,
            );
        }
        return Promise.resolve(value);
    }

    public createGuardsFn(
        guards: any[],
        instance: Controller,
        callback: (...args: any[]) => any,
    ): Fn | null {
        const canActivateFn = async (args: any[]) => {
            const canActivate = await this.guardsConsumer.tryActivate(
                guards,
                args,
                instance,
                callback,
            );
            if (!canActivate) {
                throw new ForbiddenException(FORBIDDEN_MESSAGE);
            }
        };
        return guards.length ? canActivateFn : null;
    }

    public createPipesFn(
        pipes: any[],
        paramsOptions: Array<ParamProperties & { metatype?: any }>,
    ) {
        const pipesFn = async <TRequest, TResponse>(
            args: any[],
            req: TRequest,
            res: TResponse,
            next: Fn,
        ) => {
            await Promise.all(
                paramsOptions.map(async param => {
                    const {
                        index,
                        extractValue,
                        type,
                        data,
                        metatype,
                        pipes: paramPipes,
                    } = param;
                    const value = extractValue(req, res, next);

                    args[index] = await this.getParamValue(
                        value,
                        { metatype, type, data } as any,
                        pipes.concat(paramPipes),
                    );
                }),
            );
        };
        return paramsOptions.length ? pipesFn : null;
    }

    public createHandleResponseFn() {
        return async <TResult, TResponse>(result: TResult, res: TResponse) => {
            result = await this.transformToResult(result);

            return result;
        };
    }

    public async transformToResult(resultOrDeffered: any) {
        if (resultOrDeffered && isFunction(resultOrDeffered.subscribe)) {
            return resultOrDeffered.toPromise();
        }
        return resultOrDeffered;
    }
}
