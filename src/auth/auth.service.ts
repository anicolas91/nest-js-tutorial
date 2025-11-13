import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}
  login() {}
  async signup(dto: AuthDto) {
    // generate the password hash
    const passwordHash = await argon.hash(
      dto.password,
    );
    // save the new user in the db
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash: passwordHash,
        },
      });
      8;
      // split data between hash and the rest
      const { hash, ...userWithoutHash } = user;

      // return the saved user
      return userWithoutHash;
    } catch (error) {
      if (
        error instanceof
        PrismaClientKnownRequestError
      ) {
        // this is the error code for duplicates
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            'Credentials taken',
          );
        }
        throw error; // if ti was not p2002, just throw back the error
      }
    }
  }

  async signin(dto: AuthDto) {
    // find user by email
    const user =
      await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

    // if user does not exist throw exception
    if (!user)
      throw new ForbiddenException(
        'Credentials incorrect.',
      );
    // compare password
    const pwMatches = await argon.verify(
      user.hash,
      dto.password,
    );
    // if password is incorrect throw exception
    if (!pwMatches)
      throw new ForbiddenException(
        'Credentials incorrect.',
      );

    // send back the user
    //const { hash, ...userWithoutHash } = user;

    return this.signToken(user.id, user.email);
  }

  async signToken(
    userID: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userID,
      email: email,
    };

    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(
      payload,
      {
        expiresIn: '15m',
        secret: secret,
      },
    );

    return {
      access_token: token,
    };
  }
}
