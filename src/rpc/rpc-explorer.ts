import { Injectable, SetMetadata } from '@nestjs/common';
import { compact, flattenDeep } from 'lodash';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Injectable as IInjectable } from '@nestjs/common/interfaces';

export interface IRpcHandler<T> {
    invoke(...args);
}

export interface RpcMetadata {
    method: string;
}

const RpcMetadataKey = '__rpc-metadata__';
export const RpcHandler = (metadata: RpcMetadata) => SetMetadata(RpcMetadataKey, metadata);

export interface RpcHandlerInfo {
    method: string;
    id: string;
    instance: IRpcHandler<any>;
}

@Injectable()
export class RpcExplorer {
    public exploreProviders(components: Map<any, InstanceWrapper<IInjectable>>): RpcHandlerInfo[] {
        return compact(flattenDeep(
            Array.from(components).map(component =>
                [...component.values()]
                    .map(({instance}) => this.filterCommands(instance as IRpcHandler<any>)),
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

        return {...metadata, instance};
    }
}
