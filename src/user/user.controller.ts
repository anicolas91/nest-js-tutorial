import {
  Controller,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { JwtGuard } from 'src/auth/guard';

@Controller('users')
export class UserController {
  // Guards are to allow/disallow this to run
  @UseGuards(JwtGuard)
  // This gets inside 'users/me'
  @Get('me')
  getMe(@Req() req: Request) {
    return req.user;
  }
}
