import RoomsDomain from "./RoomDomain.js";
import { parseRoomCreate, parseRoomJoin } from "./requests.js";
import { renderRoom } from "./responses.js";

export async function createRoomHandler(req, res) {
    try {
        const { name, password } = parseRoomCreate(req.body);

        const roomDomain = new RoomsDomain();
        const room = await roomDomain.createRoom(req.user.username, name, password);

        res.status(201).json(renderRoom(room));
    } catch (err) {
        res.status(400).json({ errors: [{ detail: err.message }] });
    }
}

export async function joinRoomHandler(req, res) {
    try {
        const { name, password } = parseRoomJoin(req.body);

        const roomDomain = new RoomsDomain();
        const room = await roomDomain.joinRoom(req.user.username, name, password);

        res.status(200).json(renderRoom(room));
    } catch (err) {
        res.status(400).json({ errors: [{ detail: err.message }] });
    }
}

export async function leaveRoomHandler(req, res) {
    try {
        const roomDomain = new RoomsDomain();
        const room = await roomDomain.leaveRoom(req.user.username);

        res.status(200).json(renderRoom(room));
    } catch (err) {
        res.status(400).json({ errors: [{ detail: err.message }] });
    }
}

export async function deleteRoomHandler(req, res) {
    try {
        const roomDomain = new RoomsDomain();
        const room = await roomDomain.deleteRoom(req.params.roomName);

        res.status(200).json(renderRoom(room));
    } catch (err) {
        res.status(400).json({ errors: [{ detail: err.message }] });
    }
}

export async function getRoomHandler(req, res) {
    try {
        const roomDomain = new RoomsDomain();
        const room = await roomDomain.getRoom(req.params.roomName);

        res.status(200).json(renderRoom(room));
    } catch (err) {
        res.status(400).json({ errors: [{ detail: err.message }] });
    }
}

export async function closeRoomHandler(req, res) {
    try {
        const roomDomain = new RoomsDomain();
        const room = await roomDomain.closeRoom(req.params.roomName);

        res.status(200).json(renderRoom(room));
    } catch (err) {
        res.status(400).json({ errors: [{ detail: err.message }] });
    }
}
