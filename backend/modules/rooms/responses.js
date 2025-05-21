export function renderRoom(room) {
    let players = [];
    for (let i = 0; i < room.players.length; i++) {
        players.push({
            username: room.players[i]
        });
    }
    return {
        data: {
            type: 'rooms',
            attributes: {
                name: room.name,
                status: room.status,
                createdAt: room.createdAt,
                players: players
            },
        },
    };
}

