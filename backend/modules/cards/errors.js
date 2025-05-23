import {AppError} from "../../tools/errors/AppError.js";


export class CardNotFoundError extends AppError {
    constructor(msg = 'Card not found') {
        super(msg, 'CARD_NOT_FOUND', 404);
    }
}

export class InvalidCardDataError extends AppError {
    constructor(msg = 'Invalid card data') {
        super(msg, 'INVALID_CARD_DATA', 400);
    }
}

export class CardAlreadyExistsError extends AppError {
    constructor(msg = 'Card already exists') {
        super(msg, 'CARD_ALREADY_EXISTS', 409);
    }
}