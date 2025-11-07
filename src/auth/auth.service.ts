import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
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

  signin() {
    return { msg: 'i have signed in' };
  }
}
