import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';

export type RouterProxyCallback = <TRequest, TResponse>(
    req?: TRequest,
    res?: TResponse,
    next?: () => void,
) => unknown;

export class JsonRpcProxy {
    public createProxy(
        targetCallback: RouterProxyCallback,
        exceptionsHandler: ExceptionsHandler,
    ) {
        return async <TRequest, TResponse>(
            req: TRequest,
            res: TResponse,
            next: () => void,
        ) => {
            try {
                return await targetCallback(req, res, next);
            } catch (e) {
                const host = new ExecutionContextHost([ req, null ]);
                exceptionsHandler.next(e, host);

                return e;
            }
        };
    }
}
