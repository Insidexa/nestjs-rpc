import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { users } from './users';

export interface JwtPayloadInterface {
    id: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ({ body }) => body.params.token,
            ignoreExpiration: false,
            secretOrKey: 'secret',
            passReqToCallback: false,
        });
    }

    public async validate(payload: JwtPayloadInterface) {
        const user = users.find(({ id }) => id === payload.id);
        if (user === undefined) {
            throw new UnauthorizedException();
        }

        return user;
    }
}
