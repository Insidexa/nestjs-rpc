import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class RpcLoggingMiddleware implements NestMiddleware {
    public use(req: Request, res: Response, next: () => void) {
        Logger.log(JSON.stringify(req.body), 'JSON RPC Request');

        next();
    }

}
