import { Timestamps } from "./backend";

export interface ILogin {
    username: string;
    password: string;
}

export interface IRegister {
    name: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
}

export interface IResendNewToken {
    email: string;
    type: string
}

export interface LoginResponse {
    access_token: string
    user: User
}

export interface IPasswordCore {
    password: string;
    password_confirmation: string;
}

export interface User extends Timestamps {
    _id: string;
    name: string;
    lastName: string;
    email: string;
    isActive: boolean;
    photo: string;
}