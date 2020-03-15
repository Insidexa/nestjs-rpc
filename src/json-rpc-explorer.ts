import { Injectable } from '@nestjs/common';
import { compact, flattenDeep } from 'lodash';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Injectable as IInjectable } from '@nestjs/common/interfaces';
import { RpcMetadataKey } from './context/decorators';
import { IRpcHandler, RpcHandlerInfo } from './interfaces';

@Injectable()
export class JsonRpcExplorer {
    public exploreProviders(components: Map<any, InstanceWrapper<IInjectable>>): RpcHandlerInfo[] {
        return compact(flattenDeep(
            Array.from(components).map(component =>
                [ ...component.values() ]
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
