import RoomsDB from "../../data/RoomsDB.js";
import RoomsMembers from "../../data/RoomsMembers.js";
import PasswordHasher from "../../tools/password_hasher/PasswordHasher.js";

export default class RoomsDomain {
    constructor(cfg) {
        this.roomsDb = new RoomsDB;
        this.membersDb = new RoomsMembers;
        this.cfg = cfg;
    }

    async createRoom(
        initiator,
        roomName,
        roomPassword,
    ) {
        const existingRoom = await this.roomsDb.New().filterName(roomName).get();

        if (existingRoom) {
            throw new Error('Room name already exists');
        }

        const existingUser = await this.membersDb.New().filterUsername(initiator).get();

        if (existingUser) {
            throw new Error('User already in a room');
        }

        const roomPasswordHash = await PasswordHasher.hashPassword(roomPassword);

        const createdAt = new Date();

        const newRoom = {
            name: roomName,
            passHash: roomPasswordHash,
            maxPlayers: 2,
            status: 'waiting',
            createdAt: createdAt,
        };

        await this.roomsDb.New().insert(newRoom);

        await this.joinRoom(initiator, roomName, roomPasswordHash);

        return {
            roomName: roomName,
            status: 'waiting',
            members: [initiator],
            createdAt: createdAt,
        }
    }

    async getRoom(
        roomName,
    ) {
        const room = await this.roomsDb.New().filterName(roomName).get();

        if (!room) {
            throw new Error('Room not found');
        }

        const members = await this.membersDb.New().filterRoomName(roomName).select();

        if (!members) {
            throw new Error('No members found');
        }

        return {
            roomName: room.name,
            status: room.status,
            members: members,
            createdAt: room.createdAt,
        }
    }

    async closeRoom(
        roomName,
        initiator,
    ) {
        const room = await this.roomsDb.New().filterName(roomName).get();

        if (!room) {
            throw new Error('Room not found');
        }

        if (room.status === 'closed') {
            throw new Error('Room already closed');
        }

        const existingUser = await this.membersDb.New().filterUsername(initiator).filterRoomName(roomName).get();
        if (!existingUser) {
            throw new Error('User not found');
        }

        await this.roomsDb.New().filterName(roomName).update({ status: 'closed' });
    }

    async deleteRoom(
        roomName,
    ) {
        const existingRoom = await this.roomsDb.New().filterName(roomName).get();

        if (!existingRoom) {
            throw new Error('Room not found');
        }

        await this.membersDb.New().filterRoomName(roomName).delete();

        await this.roomsDb.New().filterName(roomName).delete();
    }

    async joinRoom(
        username,
        roomName,
        roomPassword,
    ) {
        const room = await this.roomsDb.New().filterName(roomName).get();
        if (!room) {
            throw new Error('Room not found');
        }

        const existingUser = await this.membersDb.New().filterUsername(username).get();
        if (existingUser) {
            if (existingUser.roomName === roomName) {
                throw new Error('User already in this room');
            }
            throw new Error('User already in another room');
        }

        if (room.status !== 'waiting') {
            throw new Error('Room is not in waiting status');
        }

        const currentMembers = await this.membersDb.New().filterRoomName(roomName).count();
        if (currentMembers >= room.maxPlayers) {
            throw new Error('Room is full');
        }

        if (room.maxPlayers <= 0) {
            throw new Error('Room is full');
        }

        const isPasswordValid = await PasswordHasher.verifyPassword(roomPassword, room.passHash);

        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }

        const newMember = {
            username: username,
            roomName: roomName,
            joinedAt: new Date(),
        };

        await this.membersDb.New().insert(newMember);

        const currentMembersList = await this.membersDb.New().filterRoomName(roomName).select();

        return {
            roomName: roomName,
            roomStatus: room.status,
            members: currentMembersList,
            joinedAt: room.createdAt,
        }
    }

    async leaveRoom(
        username,
        roomName,
    ) {
        const user = await this.membersDb.New().filterUsername(username).get();

        if (!user) {
            throw new Error('User not found');
        }

        if (user.roomName !== roomName) {
            throw new Error('User not in this room');
        }

        await this.membersDb.New().filterUsername(username).delete();

        const currentMembers = await this.membersDb.New().filterRoomName(roomName).count();
        if (currentMembers <= 0) {
            await this.deleteRoom(roomName)
        }
    }
}