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

/**
 * @type {import('express').ErrorRequestHandler}
 */
export function errorMiddleware(err, req, res, next) {
    let errorToHandle;

    if (err instanceof AppError) {
        errorToHandle = err;
    } else {
        console.error('Unexpected error:', err);
        errorToHandle = new InternalError('Unexpected error occurred', err);
    }

    log.error(errorToHandle.message, errorToHandle.cause);

    // И возвращаем клиенту код и сообщение из errorToHandle
    return res
        .status(errorToHandle.status)
        .json({
            code: errorToHandle.code,
            error: errorToHandle.message,
        });
}
