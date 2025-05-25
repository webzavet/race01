import {BadRequestError} from "../../tools/errors/AppError.js";


function validateUrlWithExt(fieldName, urlString, allowedExts) {
    let url;
    try {
        url = new URL(urlString);
    } catch {
        throw new BadRequestError(`${fieldName} must be a valid URL`);
    }

    const pathname = url.pathname.split('/');
    const filename = pathname[pathname.length - 1];

    const dotCount = (filename.match(/\./g) || []).length;
    if (dotCount !== 1) {
        throw new BadRequestError(
            `${fieldName} filename must contain exactly one '.' before extension`
        );
    }

    const ext = filename.split('.').pop().toLowerCase();
    if (!allowedExts.includes(ext)) {
        throw new BadRequestError(
            `${fieldName} extension must be one of: ${allowedExts.join(', ')}`
        );
    }
}

export function parseCreateCard (body) {
    const { data } = body || {};

    if (!data || typeof data !== 'object') {
        throw new BadRequestError('Missing `data` object');
    }

    const {type, attributes } = data;
    if ( !type || !attributes) {
        throw new BadRequestError('Missing required registration fields');
    }

    if (type !== 'create_card') {
        throw new BadRequestError('Invalid type');
    }

    const { name, icon, sound, descr, attack, defence, cost, attribute } = attributes;
    if ( !icon || !descr || !attack || !defence || !cost || !attribute) {
        throw new BadRequestError('Missing required card fields');
    }

    validateUrlWithExt('Icon', icon, ['png', 'jpg', 'jpeg', 'img']);

    if (sound) {
        validateUrlWithExt('Sound', sound, ['mp3']);
    }

    return { name, icon, sound, descr, attack, defence, cost, attribute };
}