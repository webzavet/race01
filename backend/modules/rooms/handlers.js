import RoomsDomain from "./RoomDomain.js";
import { parseRoomCreate, parseRoomJoin } from "./requests.js";
import { renderRoom } from "./responses.js";
import config from "../../tools/config/Config.js";

const roomsDomain = new RoomsDomain(config);

export async function createRoomHandler(req, res, next) {
    try {
        const { name, password } = parseRoomCreate(req.body);

        const roomDomain = new RoomsDomain();
        const room = await roomDomain.createRoom(req.user.username, name, password);

        res.status(201).json(renderRoom(room));
    } catch (err) {
        next(err)
    }
}

export async function joinRoomHandler(req, res, next) {
    try {
        const { name, password } = parseRoomJoin(req.body);

        const roomDomain = new RoomsDomain();
        const room = await roomDomain.joinRoom(req.user.username, name, password);

        res.status(200).json(renderRoom(room));
    } catch (err) {
        next(err)
    }
}

export async function leaveRoomHandler(req, res, next) {
    try {
        const roomDomain = new RoomsDomain();
        await roomDomain.leaveRoom(req.user.username);

        res.status(204)
    } catch (err) {
        next(err)
    }
}

export async function deleteRoomHandler(req, res, next) {
    try {
        const roomDomain = new RoomsDomain();
        await roomDomain.deleteRoom(req.params.roomName);

        res.status(204);
    } catch (err) {
        next(err)
    }
}

export async function getRoomHandler(req, res, next) {
    try {
        const roomDomain = new RoomsDomain();
        const room = await roomDomain.getRoom(req.params.roomName);

        res.status(200).json(renderRoom(room));
    } catch (err) {
        next(err)
    }
}

export async function closeRoomHandler(req, res, next) {
    try {
        const roomDomain = new RoomsDomain();
        const room = await roomDomain.closeRoom(req.params.roomName);

        res.status(200).json(renderRoom(room));
    } catch (err) {
        next(err)
    }
}
