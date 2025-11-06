import { Injectable } from "@nestjs/common";

@Injectable({})
export class AuthService { 
    login() {}
    signup() { 
        return { msg: 'i have signed up' };
    }
    signin() { 
        return { msg: 'i have signed in' };
    }
}