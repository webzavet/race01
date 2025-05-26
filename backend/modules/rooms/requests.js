import {BadRequestError} from "../../tools/errors/AppError.js";


export function parseRoomCreate(body) {
    const { data } = body || {};

    if (!data || typeof data !== 'object') {
        throw new BadRequestError('Missing `data` object');
    }

    const { id, type, attributes } = data;

    if (!id || !type || !attributes) {
        throw new BadRequestError('Missing required room fields');
    }

    if (type !== 'create_room') {
        throw new BadRequestError('Invalid type');
    }

    const { password } = attributes;

    return { id: id, password };
}

export function parseRoomJoin(body) {
    const { data } = body || {};

    if (!data || typeof data !== 'object') {
        throw new BadRequestError('Missing `data` object');
    }

    const { id, type, attributes } = data;

    if (type !== 'join_room') {
        throw new BadRequestError('Invalid type');
    }

    if (!id || !type || !attributes) {
        throw new BadRequestError('Missing required room fields');
    }

    const { password } = attributes;

    return { id: id, password };
}