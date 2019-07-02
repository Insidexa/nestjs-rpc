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
import { RpcId, RpcPayload, RpcVersion } from '../rpc/decorators';

@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        return true;
    }
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle();
    }
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        return exception;
    }
}

@Injectable()
export class ValidationPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
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
    public invoke(
        @RpcPayload() payload: any,
        @RpcVersion() version: string,
        @RpcId() id: any,
    ) {
        return payload;
    }
}
