export function renderRoom(room) {
    let players = [];
    for (let i = 0; i < room.players.length; i++) {
        players.push({
            username: room.players[i]
        });
    }
    return {
        data: {
            id: room.id,
            type: 'room',
            attributes: {
                status: room.status,
                createdAt: room.createdAt,
                players: players
            },
        },
    };
}

