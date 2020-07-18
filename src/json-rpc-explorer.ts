import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { RpcMetadataKey, RpcMethodMetadataKey } from './context/decorators';
import { RpcMethodHandler } from './interfaces';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import { Module } from '@nestjs/core/injector/module';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JsonRpcExplorer {
    private metadataScanner = new MetadataScanner();
    private defaultSingleMethod = 'invoke';

    constructor(
        private nestDiscovery: DiscoveryService,
    ) {
    }

    public explore(module: Module): RpcMethodHandler[] {
        return this.nestDiscovery
            .getProviders({}, [module])
            .reduce((acc, instanceWrapper) => {
                const methods = this.filterHandlers(instanceWrapper);
                return [...acc, ...methods ? methods: [] ];
            }, []);
    }

    private filterHandlers(instanceWrapper: InstanceWrapper): RpcMethodHandler[] {
        const { instance } = instanceWrapper;
        if (!instance) {
            return;
        }

        const metadata = Reflect.getMetadata(RpcMetadataKey, instance.constructor);

        if (metadata === undefined) {
            return;
        }
        const instancePrototype = Object.getPrototypeOf(instanceWrapper.instance);

        if (instance[this.defaultSingleMethod]) {
            return [
                {
                    callback: instance.invoke,
                    methodName: this.defaultSingleMethod,
                    instanceWrapper,
                    rpcMethodName: metadata.method,
                },
            ];
        }

        return this.metadataScanner.scanFromPrototype(instance, instancePrototype, method => {
            const { rpcMethodMetadata, callback } = this.exploreMethodHandlers(method, instancePrototype);
            const rpcMethodName = metadata.method.length === 0
                ? rpcMethodMetadata.name
                : `${metadata.method}.${rpcMethodMetadata.name}`;

            return {
                callback,
                methodName: method,
                instanceWrapper,
                rpcMethodName,
            };
        });
    }

    private exploreMethodHandlers(method, instancePrototype: any) {
        const callback = instancePrototype[method];
        const rpcMethodMetadata = Reflect.getMetadata(
            RpcMethodMetadataKey,
            callback,
        );
        if (isUndefined(rpcMethodMetadata)) {
            return null;
        }

        return {
            callback,
            rpcMethodMetadata,
        };
    }

}
