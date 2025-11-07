import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {} /// I don't care how to instantiate, just do it for me

  @Post('signup')
  signup(@Body() dto: AuthDto) {
    console.log(dto);
    return this.authService.signup();
  }

  @Post('signin')
  signin() {
    return this.authService.signin();
  }
}
