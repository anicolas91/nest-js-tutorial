import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
  'jwt',
) {
  async validate(payload: {
    sub: number;
    email: string;
  }) {
    // getting values
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
      });

    // Handle null case
    if (!user) {
      throw new UnauthorizedException(
        'User not found',
      );
    }

    // split hash from the rest
    const { hash, ...userWithoutHash } = user;

    return userWithoutHash;
  }

  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET', ''),
    });
  }
}
