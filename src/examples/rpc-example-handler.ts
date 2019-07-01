import {
    ArgumentMetadata,
    ArgumentsHost,
    CallHandler,
    CanActivate,
    Catch,
    ExceptionFilter,
    ExecutionContext,
    HttpException,
    Injectable,
    NestInterceptor,
    PipeTransform,
    UseFilters,
    UseGuards,
    UseInterceptors,
    UsePipes,
} from '@nestjs/common';
import { IRpcHandler, RpcHandler } from '../rpc/rpc-explorer';
import { Observable } from 'rxjs';
import { Response } from 'express';
import { tap } from 'rxjs/operators';
import { RpcId, RpcPayload, RpcVersion } from '../rpc/decorators';

@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        console.log('Guard');
        return true;
    }
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        console.log('Before...');

        const now = Date.now();
        return next
            .handle()
            .pipe(
                tap(() => console.log(`After... ${Date.now() - now}ms`)),
            );
    }
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        console.log('Filter');
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();

        return exception;
        // response
        //     .status(status)
        //     .json({
        //         statusCode: status,
        //         timestamp: new Date().toISOString(),
        //         path: request.url,
        //         response: exception.getResponse(),
        //         message: exception.message,
        //     });
    }
}

@Injectable()
export class ValidationPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        console.log('Pipe');
        return value;
    }
}

@RpcHandler({
    method: 'example',
})
export class RpcExampleHandler implements IRpcHandler<any> {
    @UseGuards(AuthGuard)
    @UseInterceptors(LoggingInterceptor)
    @UsePipes(ValidationPipe)
    @UseFilters(HttpExceptionFilter)
    public async invoke(
        @RpcPayload() payload: any,
        @RpcVersion() version: string,
        @RpcId() id: any,
    ) {
        console.log('arguments', arguments)
        // throw new HttpException('2123', 200)
        console.log('payload', payload);
        console.log('version', version);
        console.log('id', id);
        return payload;
    }
}
