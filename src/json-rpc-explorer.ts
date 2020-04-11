import { compact } from 'lodash';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Injectable as IInjectable } from '@nestjs/common/interfaces';
import { RpcMetadataKey } from './context/decorators';
import { IRpcHandler, RpcHandlerInfo } from './interfaces';

export class JsonRpcExplorer {
    public static exploreProviders(components: Map<any, InstanceWrapper<IInjectable>>): InstanceWrapper<IRpcHandler>[] {
        return compact([ ...components.values() ].map(instanceWrapper => {
            return this.filterCommands(instanceWrapper);
        }));
    }

    protected static filterCommands(instanceWrapper: InstanceWrapper): InstanceWrapper<RpcHandlerInfo> {
        const { instance } = instanceWrapper;
        if (!instance) {
            return;
        }

        const metadata = Reflect.getMetadata(RpcMetadataKey, instance.constructor);

        if (metadata === undefined) {
            return;
        }

        return instanceWrapper;
    }
}
