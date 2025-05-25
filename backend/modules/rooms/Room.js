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

export default class RoomsDomain {
    constructor() {
        this.db = database;
        this.cfg = config;
    }

    async createRoom(
        initiator,
        roomName,
        roomPassword,
    ) {
        if (roomName.trim() === '' || roomName.length < 3 || roomName.length > 32) {
            throw new RoomNameIsInvalidError('Room name must be between 3 and 32 characters');
        }

        if (!roomPassword || roomPassword.length < 6) {
            throw new RoomPasswordRequiredError('Password must be at least 6 characters');
        }

        if (await this.db.rooms().filterName(roomName).get()) {
            throw new RoomNameAlreadyTakenError('Room name already taken');
        }

        if (await this.db.players().filterUsername(initiator).get()) {
            throw new PlayerAlreadyInRoomError('Player already in a room');
        }

        const roomPasswordHash = await PasswordHasher.hashPassword(roomPassword);
        const createdAt = new Date();

        //Trx
        await this.db.transaction(async (trx) => {
            const newRoom = {
                name: roomName,
                passHash: roomPasswordHash,
                maxPlayers: 2,
                status: 'waiting',
                createdAt: createdAt,
            };

            await trx.rooms.insert(newRoom);

            const player = {
                id:        uuidv4(),
                username: initiator,
                roomName: roomName,
                createdAt: createdAt,
            };

            await trx.players.insert(player);
        })

        return {
            roomName: roomName,
            status: 'waiting',
            players: [ initiator ],
            createdAt: createdAt,
        }
    }

    async getRoom(
        roomName,
    ) {
        const room = await this.db.rooms().filterName(roomName).get();
        if (!room) {
            throw new RoomNotFoundError('Room not found');
        }

        const players = await this.db.players().filterRoomName(roomName).select();
        if (!players) {
            throw new PlayersNotFoundError('No players found');
        }

        let usernames = players.map(player => player.username);

        return {
            roomName: room.name,
            status: room.status,
            players: usernames,
            createdAt: room.createdAt,
        }
    }

    async closeRoom(
        roomName,
        initiator,
    ) {
        const player = await this.db.players().filterUsername(initiator).get();
        if (!player) {
            throw new PlayerNotFoundError('Player not found');
        }

        if (player.room_name !== roomName) {
            throw new PlayersIsNotInThisRoomError('Player not in this room');
        }

        const room = await this.db.rooms().filterName(roomName).get();
        if (!room) {
            throw new RoomNotFoundError('Room not found');
        }

        let players = await this.db.players().filterRoomName(roomName).select();
        if (players.length <= 1) {
            throw new RoomIsNotEnoughPlayersError('Room is not enough players');
        }

        let usernames = players.map(player => player.username);

        if (room.status === 'playing') {
            return {
                roomName: room.name,
                status: room.status,
                players: usernames,
                createdAt: room.createdAt,
            }
        }

        await this.db.rooms().filterName(roomName).updateStatus('playing');

        return await this.getRoom(roomName);
    }

    async deleteRoom(
        roomName,
        initiator,
    ) {
        const existingRoom = await this.db.rooms().filterName(roomName).get();
        if (!existingRoom) {
            throw new RoomNotFoundError('Room not found');
        }

        const existingUser = await this.db.players().filterUsername(initiator).filterRoomName(roomName).get();
        if (!existingUser) {
            throw new PlayersIsNotInThisRoomError('Player not in this room');
        }

        await this.db.transaction(async (trx) => {

            await this.db.players().filterRoomName(roomName).delete()

            await this.db.rooms().filterName(roomName).delete()
        })
    }

    async joinRoom(
        username,
        roomName,
        roomPassword,
    ) {
        let room = await this.db.rooms().filterName(roomName).get();
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


        let players = await this.db.players().filterRoomName(roomName).count();
        if (players >= room.max_players) {
            throw new RoomIsFullError('Room is full');
        }

        const isPasswordValid = await PasswordHasher.verifyPassword(roomPassword, room.password_hash);
        if (!isPasswordValid) {
            throw new RoomPasswordIsInvalidError('Invalid password');
        }

        const newPlayer = {
            id:        uuidv4(),
            username: username,
            roomName: roomName,
            createdAt: new Date(),
        };


        await this.db.players().insert(newPlayer);


        players = await this.db.players().filterRoomName(roomName).select();

        let usernames = players.map(player => player.username);

        return {
            roomName:    roomName,
            roomStatus:  room.status,
            players:     usernames,
            createdAt:   room.createdAt,
        }
    }

    async leaveRoom(
        username,
        roomName,
    ) {
        let player = await this.db.players().filterUsername(username).get();
        if (!player) {
            throw new PlayersNotFoundError('Player not found');
        }

        if (player.room_name !== roomName) {
            throw new PlayersIsNotInThisRoomError('Player not in this room');
        }

        await this.db.transaction(async (trx) => {
            await this.db.players().filterUsername(username).delete();

            let players = await this.db.players().filterRoomName(roomName).count();
            if (players === 0) {
                await this.db.rooms().filterName(roomName).delete();
            }
        })
    }
}