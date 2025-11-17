import {
  Controller,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { User } from '@prisma/client';
import type { Request } from 'express';
import { GetUser } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';

@Controller('users')
export class UserController {
  // Guards are to allow/disallow this to run
  @UseGuards(JwtGuard)
  // This gets inside 'users/me'
  @Get('me')
  getMe(@GetUser() user: User) {
    return user;
  }
}
