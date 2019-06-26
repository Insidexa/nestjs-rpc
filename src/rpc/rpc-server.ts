import { Injectable } from '@nestjs/common';
import { AbstractHttpAdapter } from '@nestjs/core';
import { RpcConfig } from './rpc.module';
import { Express } from 'express';
import { IncomingMessage } from 'http';

@Injectable()
export class RpcServer {
    public run(httpAdapter: AbstractHttpAdapter, config: RpcConfig) {
        httpAdapter.post(config.path, (s: IncomingMessage) => {
            console.log(s);

            // res.sendStatus(200);
        });
    }
}
