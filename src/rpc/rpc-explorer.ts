import { Injectable, SetMetadata, Type } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { flattenDeep, compact } from 'lodash';

export interface IRpcHandler<T> {
    invoke(payload: T);
}

export interface RpcMetadata {
    method: string;
}
const RpcMetadataKey = '__rpc-metadata__';
export const RpcHandler = (metadata: RpcMetadata) => SetMetadata(RpcMetadataKey, metadata);

export interface RpcHandlerInfo {
    type: Type<any>;
    instance: IRpcHandler<any>;
}

@Injectable()
export class RpcExplorer {
    constructor(
        private modulesContainer: ModulesContainer,
    ) {
    }

    public explore(): RpcHandlerInfo[] {
        const components = [
            ...this.modulesContainer.values(),
        ].map(module => module.providers);

        return compact(flattenDeep(
            components.map(component =>
                [...component.values()]
                    .map(({ instance }) => this.filterCommands(instance as IRpcHandler<any>)),
            ),
        ));
    }

    protected filterCommands(instance: IRpcHandler<any>) {
        if (!instance) {
            return;
        }

        const metadata = Reflect.getMetadata(RpcMetadataKey, instance.constructor);

        if (metadata === undefined) {
            return;
        }

        return { ...metadata, instance };
    }
}
