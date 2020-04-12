import { HttpServer } from '@nestjs/common';
import { CustomHeader } from '@nestjs/core/router/router-response-controller';

export class JsonRpcResponseController {
    constructor(
        private applicationRef: HttpServer,
    ) {
    }

    public setHeaders<TResponse = unknown>(
        response: TResponse,
        headers: CustomHeader[],
    ) {
        headers.forEach(({ name, value }) =>
            this.applicationRef.setHeader(response, name, value),
        );
    }

    public setStatus<TResponse = unknown>(
        response: TResponse,
        statusCode: number,
    ) {
        this.applicationRef.status(response, statusCode);
    }
}
