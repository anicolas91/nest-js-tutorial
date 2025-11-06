import { Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller('auth')
export class AuthController { 
    constructor(private authService: AuthService) { } /// I don't care how to instantiate, just do it for me

    @Post('signup')
    signup() {
        return 'i am signed up';
    }

    @Post('signin')
    signin() {
        return 'i am signed in';
    }
}