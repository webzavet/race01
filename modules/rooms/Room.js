import {database} from "../../data/sql/Database.js";
import config from "../../tools/config/Config.js";
import PasswordHasher from "../../tools/password_hasher/PasswordHasher.js";

import { v4 as uuidv4 } from 'uuid';
import {
    PlayerAlreadyInRoomError,
    PlayerNotFoundError,
    RoomNameAlreadyTakenError,
    RoomNameIsInvalidError,
    RoomNotFoundError,
    PlayersIsNotInThisRoomError,
    RoomPasswordRequiredError,
    PlayersNotFoundError,
    RoomIsClosedError,
    RoomIsFullError,
    RoomPasswordIsInvalidError, RoomIsNotEnoughPlayersError,
} from "./errors.js";


const waitingStatus = 'waiting';
const playingStatus = 'playing';

export default class RoomsDomain {
    constructor() {
        this.db = database;
        this.cfg = config;
    }

    async createRoom(
        initiator,
        roomID,
        roomPassword,
    ) {
        if (roomID.trim() === '' || roomID.length < 3 || roomID.length > 32) {
            throw new RoomNameIsInvalidError('Room name must be between 3 and 32 characters');
        }

        if (!roomPassword || roomPassword.length < 6) {
            throw new RoomPasswordRequiredError('Password must be at least 6 characters');
        }

        if (await this.db.rooms().filterID(roomID).get()) {
            throw new RoomNameAlreadyTakenError('Room id already taken');
        }

        if (await this.db.players().filterUsername(initiator).get()) {
            throw new PlayerAlreadyInRoomError('Player already in a room');
        }

        const roomPasswordHash = await PasswordHasher.hashPassword(roomPassword);
        const createdAt = new Date();

        //Trx
        await this.db.transaction(async (trx) => {
            await trx.rooms.insert({
                id:        roomID,
                passHash:  roomPasswordHash,
                status:    waitingStatus,
                createdAt: createdAt,
            });

            const player = {
                id:        uuidv4(),
                username:  initiator,
                room:      roomID,
                createdAt: createdAt,
            };

            await trx.players.insert(player);
        })

        return {
            id:        roomID,
            status:    waitingStatus,
            players: [ initiator ],
            createdAt: createdAt,
        }
    }

    async getRoom(
        id,
    ) {
        const room = await this.db.rooms().filterID(id).get();
        if (!room) {
            throw new RoomNotFoundError('Room not found');
        }

        const players = await this.db.players().filterRoom(id).select();
        if (!players) {
            throw new PlayersNotFoundError('No players found');
        }

        let usernames = players.map(player => player.username);

        return {
            id:        room.id,
            status:    room.status,
            players:   usernames,
            createdAt: room.createdAt,
        }
    }

    async closeRoom(
        roomID,
        initiator,
    ) {
        const player = await this.db.players().filterUsername(initiator).get();
        if (!player) {
            throw new PlayerNotFoundError('Player not found');
        }

        if (player.room !== roomID) {
            throw new PlayersIsNotInThisRoomError('Player not in this room');
        }

        const room = await this.db.rooms().filterID(roomID).get();
        if (!room) {
            throw new RoomNotFoundError('Room not found');
        }

        let players = await this.db.players().filterRoom(roomID).select();
        if (players.length !== 2) {
            throw new RoomIsClosedError('Not enough players to start the game');
        }

        let usernames = players.map(player => player.username);

        if (room.status === playingStatus) {
            return {
                room:      room.name,
                status:    room.status,
                players:   usernames,
                createdAt: room.createdAt,
            }
        }

        await this.db.rooms().filterID(roomID).updateStatus('playing');

        return await this.getRoom(roomID);
    }

    async deleteRoom(
        roomID,
        initiator,
    ) {
        const existingRoom = await this.db.rooms().filterID(roomID).get();
        if (!existingRoom) {
            throw new RoomNotFoundError('Room not found');
        }

        const existingUser = await this.db.players().filterUsername(initiator).filterRoom(roomID).get();
        if (!existingUser) {
            throw new PlayersIsNotInThisRoomError('Player not in this room');
        }

        await this.db.transaction(async (trx) => {

            await this.db.players().filterRoom(roomID).delete()

            await this.db.rooms().filterID(roomID).delete()
        })
    }

    async joinRoom(
        username,
        roomID,
        roomPassword,
    ) {
        let room = await this.db.rooms().filterID(roomID).get();
        if (!room) {
            throw new RoomNotFoundError('Room not found');
        }
        if (room.status !== 'waiting') {
            throw new RoomIsClosedError('Room is not in waiting status');
        }

        let player = await this.db.players().filterUsername(username).get();
        if (player) {
            throw new PlayerAlreadyInRoomError('Player already in a room');
        }

        let players = await this.db.players().filterRoom(roomID).count();
        if (players >= 2) {
            throw new RoomIsFullError('Room is full');
        }

        const isPasswordValid = await PasswordHasher.verifyPassword(roomPassword, room.password_hash);
        if (!isPasswordValid) {
            throw new RoomPasswordIsInvalidError('Invalid password');
        }

        const newPlayer = {
            id:        uuidv4(),
            username:  username,
            room:      roomID,
            createdAt: new Date(),
        };

        await this.db.players().insert(newPlayer);

        players = await this.db.players().filterRoom(roomID).select();

        let usernames = players.map(player => player.username);

        return {
            room:        roomID,
            roomStatus:  room.status,
            players:     usernames,
            createdAt:   room.createdAt,
        }
    }

    async leaveRoom(
        username,
        roomID,
    ) {
        let player = await this.db.players().filterUsername(username).get();
        if (!player) {
            throw new PlayersNotFoundError('Player not found');
        }

        if (player.room !== roomID) {
            throw new PlayersIsNotInThisRoomError('Player not in this room');
        }

        await this.db.transaction(async (trx) => {
            await this.db.players().filterUsername(username).delete();

            let players = await this.db.players().filterRoom(roomID).count();
            if (players === 0) {
                await this.db.rooms().filterID(roomID).delete();
            }
        })
    }
}