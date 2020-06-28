import { RpcHandler, IRpcHandler, RpcPayload, RpcVersion, RpcId, RpcMethod } from '@jashkasoft/nestjs-json-rpc';
import { JwtService } from '@nestjs/jwt';
import { users } from './users';
import { NotFoundException } from '@nestjs/common';

@RpcHandler({ method: 'signin' })
export class SignInHandler implements IRpcHandler<any> {
  constructor(
      private jwt: JwtService,
  ) {
  }

  public invoke(
      @RpcPayload() payload: any,
      @RpcVersion() version: string,
      @RpcId() id: number | string,
      @RpcMethod() method: string
  ) {
    const user = users.find(({ login, password }) => {
      return login === payload.login && password === payload.password;
    });

    if (user === undefined) {
      throw new NotFoundException('User not found');
    }

    return {
      user: {
        id: user.id,
        name: user.name,
      },
      token: this.jwt.sign({ id: user.id }),
    }
  }
}
