import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UserController {
  // Guards are to allow/disallow this to run
  @UseGuards(AuthGuard('jwt'))
  // This gets inside 'users/me'
  @Get('me')
  getMe() {
    return 'user info';
  }
}
