/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'SEAPEDIA_SUPER_SECRET_KEY_2026', 
    });
  }

  validate(payload: any) {
    // Mengembalikan data yang akan ditempel di 'req.user'
    return { 
      userId: payload.sub, 
      username: payload.username, 
      roles: payload.roles, // Ini sekarang adalah Array: ['BUYER', 'SELLER']
    };
  }
}