import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';

export type RouterProxyCallback = <TRequest, TResponse>(
    req?: TRequest,
    res?: TResponse,
    next?: () => void,
) => void;

export class RpcProxy {
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
                const host = new ExecutionContextHost([req]);
                exceptionsHandler.next(e, host);

                return e;
            }
        };
    }

    public createExceptionLayerProxy(
        targetCallback: <TError, TRequest, TResponse>(
            err: TError,
            req: TRequest,
            res: TResponse,
            next: () => void,
        ) => void,
        exceptionsHandler: ExceptionsHandler,
    ) {
        return async <TError, TRequest, TResponse>(
            err: TError,
            req: TRequest,
            res: TResponse,
            next: () => void,
        ) => {
            try {
                await targetCallback(err, req, res, next);
            } catch (e) {
                const host = new ExecutionContextHost([req]);
                exceptionsHandler.next(e, host);
            }
        };
    }
}
