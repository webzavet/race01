import {AppError} from "../../tools/errors/AppError.js";

export class RoomNameIsInvalidError extends AppError {
    constructor(msg = 'Room name is invalid') {
        super(msg, 'ROOM_NAME_IS_INVALID', 400);
    }
}

export class RoomPasswordRequiredError extends AppError {
    constructor(msg = 'Room password required') {
        super(msg, 'ROOM_PASSWORD_REQUIRED', 400);
    }
}

export class RoomPasswordIsInvalidError extends AppError {
    constructor(msg = 'Room password is invalid') {
        super(msg, 'ROOM_PASSWORD_IS_INVALID', 400);
    }
}

export class RoomNameAlreadyTakenError extends AppError {
    constructor(msg = 'Room name already taken') {
        super(msg, 'ROOM_NAME_ALREADY_TAKEN', 409);
    }
}

export class PlayersNotFoundError extends AppError {
    constructor(msg = 'Room players not found') {
        super(msg, 'ROOM_PLAYERS_NOT_FOUND', 404);
    }
}

export class PlayersIsNotInThisRoomError extends AppError {
    constructor(msg = 'Room players is not in this room') {
        super(msg, 'ROOM_PLAYERS_IS_NOT_IN_THIS_ROOM', 404);
    }
}

export class RoomNotFoundError extends AppError {
    constructor(msg = 'Room not found') {
        super(msg, 'ROOM_NOT_FOUND', 404);
    }
}

export class PlayerNotFoundError extends AppError {
    constructor(msg = 'Player not found') {
        super(msg, 'PLAYER_NOT_FOUND', 404);
    }
}

export class PlayerAlreadyInRoomError extends AppError {
    constructor(msg = 'Player already in room') {
        super(msg, 'PLAYER_ALREADY_IN_ROOM', 409);
    }
}

export class RoomIsClosedError extends AppError {
    constructor(msg = 'Room is closed') {
        super(msg, 'ROOM_IS_CLOSED', 403);
    }
}

export class RoomIsFullError extends AppError {
    constructor(msg = 'Room is full') {
        super(msg, 'ROOM_IS_FULL', 403);
    }
}

