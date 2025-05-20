export function parseRoomCreate(body) {
    const { data } = body || {};

    if (!data || typeof data !== 'object') {
        throw new Error('Missing `data` object');
    }

    const { name, password } = data;

    if (!name || !password) {
        throw new Error('Missing required room fields');
    }

    return { name, password };
}

export function parseRoomJoin(body) {
    const { data } = body || {};

    if (!data || typeof data !== 'object') {
        throw new Error('Missing `data` object');
    }

    const { name, password } = data;

    if (!name || !password) {
        throw new Error('Missing required room fields');
    }

    return { name, password };
}