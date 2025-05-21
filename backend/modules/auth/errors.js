import {AppError} from "../../tools/errors/AppError.js";

export class UserNotFoundError extends AppError {
    constructor(msg = 'User not found') {
        super(msg, 'USER_NOT_FOUND', 404);
    }
}

export class UserAlreadyExistsError extends AppError {
    constructor(msg = 'User already exists') {
        super(msg, 'USER_ALREADY_EXISTS', 409);
    }
}

export class PasswordMismatchError extends AppError {
    constructor(msg = 'Passwords do not match') {
        super(msg, 'PASSWORD_MISMATCH', 400);
    }
}

export class InvalidPasswordError extends AppError {
    constructor(msg = 'Invalid password') {
        super(msg, 'INVALID_PASSWORD', 409);
    }
}