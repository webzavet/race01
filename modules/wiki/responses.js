export function renderCard(card) {
    return {
        data: {
            id: card.id,
            type: 'card',
            attributes: {
                name: card.name,
                icon: card.icon,
                sound: card.sound,
                descr: card.descr,
                attack: card.attack,
                defence: card.defence,
                cost: card.cost,
                attribute: card.attribute
            },
        },
    };
}

export function renderCardsCollection(data) {
    const cards = data.map(card => ({
        id: card.id,
        type: 'cards',
        attributes: {
            name: card.name,
            icon: card.icon,
            sound: card.sound,
            descr: card.descr,
            attack: card.attack,
            defence: card.defence,
            cost: card.cost,
            attribute: card.attribute
        },
    }));

    return {
        data: {
            type: 'cards_collection',
            attributes: {
                cards: cards,
            },
        },
    };
}