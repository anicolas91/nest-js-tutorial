import { Controller } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller()
export class AuthController { 
    constructor(private authService: AuthService) { } /// I don't care how to instantiate, just do it for me

}