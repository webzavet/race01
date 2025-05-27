// middleware/errors.js
import {
    UserNotFoundError,
    UserAlreadyExistsError,
    PasswordMismatchError,
    InvalidPasswordError
} from '../../modules/auth/errors.js';

import {
    RoomNameIsInvalidError,
    RoomPasswordRequiredError,
    RoomPasswordIsInvalidError,
    RoomNameAlreadyTakenError,
    PlayersNotFoundError,
    PlayersIsNotInThisRoomError,
    RoomNotFoundError,
    PlayerNotFoundError,
    PlayerAlreadyInRoomError,
    RoomIsClosedError,
    RoomIsFullError
} from '../../modules/rooms/errors.js';
import {AppError, InternalError} from "../../tools/errors/AppError.js";
import log from "../../tools/logger/Logger.js";

/** @type {import('express').ErrorRequestHandler} */
export function errorMiddleware(err, req, res, next) {
    let errorToHandle;

    if (err instanceof AppError) {
        errorToHandle = err;
    } else {
        console.error('Unexpected error:', err);
        errorToHandle = new InternalError('Unexpected error occurred', err);
    }

    // Логируем и саму ошибку, и её причину (cause), если есть
    log.error(`Error: ${errorToHandle.message}`, errorToHandle.cause);

    // Формируем массив ошибок
    const payload = {
        errors: [
            {
                code:   errorToHandle.code,
                status: errorToHandle.status,
                detail: errorToHandle.message,
            }
        ]
    };

    return res
        .status(errorToHandle.status)
        .json(payload);
}