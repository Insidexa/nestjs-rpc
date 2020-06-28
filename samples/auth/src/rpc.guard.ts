import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RPCGuard extends AuthGuard('jwt') {
}
