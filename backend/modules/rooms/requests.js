import {BadRequestError} from "../../tools/errors/AppError.js";


export function parseRoomCreate(body) {
    const { data } = body || {};

    if (!data || typeof data !== 'object') {
        throw new BadRequestError('Missing `data` object');
    }

    const { name, password } = data;

    if (!name || !password) {
        throw new BadRequestError('Missing required room fields');
    }

    return { name, password };
}

export function parseRoomJoin(body) {
    const { data } = body || {};

    if (!data || typeof data !== 'object') {
        throw new BadRequestError('Missing `data` object');
    }

    const { password } = data;

    if ( !password) {
        throw new BadRequestError('Missing required room fields');
    }

    return { password };
}