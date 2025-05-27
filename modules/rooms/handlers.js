import RoomsDomain from "./Room.js";
import { parseRoomCreate, parseRoomJoin } from "./requests.js";
import { renderRoom } from "./responses.js";
import config from "../../tools/config/Config.js";
import log from "../../tools/logger/Logger.js";
import {BadRequestError} from "../../tools/errors/AppError.js";

const roomsDomain = new RoomsDomain();

export async function createRoomHandler(req, res, next) {
    try {
        const { id, password } = parseRoomCreate(req.body);

        const room = await roomsDomain.createRoom(req.user.username, id, password);

        log.info(`Room ${id} created by ${req.user.username}`);
        res.status(201).json(renderRoom(room));
    } catch (err) {
        next(err)
    }
}

export async function getRoomHandler(req, res, next) {
    try {
        const room = await roomsDomain.getRoom(req.params.roomID);

        log.info(`Room ${req.params.roomID} fetched`);
        res.status(200).json(renderRoom(room));
    } catch (err) {
        next(err)
    }
}

export async function closeRoomHandler(req, res, next) {
    try {
        const room = await roomsDomain.closeRoom(req.params.roomID, req.user.username);

        log.info(`Room ${req.params.roomID} closed`);
        res.status(200).json(renderRoom(room));
    } catch (err) {
        next(err)
    }
}

export async function deleteRoomHandler(req, res, next) {
    try {
        await roomsDomain.deleteRoom(req.params.roomID, req.user.username);

        log.info(`Room ${req.params.roomID} deleted`);
        res.status(204).end();
    } catch (err) {
        next(err)
    }
}

export async function joinRoomHandler(req, res, next) {
    try {
        const { id, password } = parseRoomJoin(req.body);

        if (req.params.roomID === id) {
            new BadRequestError("Room id is required");
        }

        const room = await roomsDomain.joinRoom(req.user.username, req.params.roomID, password);

        log.info(`User ${req.user.username} joined room ${req.params.roomID}`);
        res.status(200).json(renderRoom(room));
    } catch (err) {
        next(err)
    }
}

export async function leaveRoomHandler(req, res, next) {
    try {
        await roomsDomain.leaveRoom(req.user.username, req.params.roomID);

        log.info(`User ${req.user.username} leave room ${req.params.roomID}`);
        res.status(204).end()
    } catch (err) {
        next(err)
    }
}