import { compact } from 'lodash';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Injectable as IInjectable } from '@nestjs/common/interfaces';
import { RpcMetadataKey, RpcMethodMetadataKey } from './context/decorators';
import { RpcMethodHandler } from './interfaces';
import { MetadataScanner } from '@nestjs/core';
import { isUndefined } from '@nestjs/common/utils/shared.utils';

export class JsonRpcExplorer {
    constructor(
        private metadataScanner: MetadataScanner,
    ) {
    }

    public explore(components: Map<any, InstanceWrapper<IInjectable>>): RpcMethodHandler[] {
        return compact([...components.values()]
            .reduce((acc, instanceWrapper) => {
                const methods = this.filterHandlers(instanceWrapper);
                return [...acc, ...methods ? methods: [] ];
            }, []));
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

        if (instance.invoke) {
            return [
                {
                    callback: instance.invoke,
                    methodName: 'invoke',
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
