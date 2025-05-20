export function renderRoom(room) {
    let members = [];
    for (let i = 0; i < room.members.length; i++) {
        members.push({
            username: room.members[i].username
        });
    }
    return {
        data: {
            type: 'rooms',
            attributes: {
                name: room.name,
                status: room.status,
                createdAt: room.createdAt,
                members: members
            },
        },
    };
}

