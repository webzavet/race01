import {database} from "../../data/Database.js";
import PasswordHasher from '../../tools/password_hasher/PasswordHasher.js';
import TokenManager from '../../tools/tokens/TokenManager.js';
import config from "../../tools/config/Config.js";
import {v4 as uuidv4} from "uuid";
import {
    InvalidCardDataError,
    CardNotFoundError, CardAlreadyExistsError
} from "./errors.js";

function CreateCardsModel(cardFromDb) {
    return {
        id: cardFromDb.id,
        name: cardFromDb.name,
        icon: cardFromDb.icon,
        sound: cardFromDb.sound,
        descr: cardFromDb.descr,
        attack: cardFromDb.attack,
        defence: cardFromDb.defence,
        cost: cardFromDb.cost,
        attribute: cardFromDb.attribute,
        createdAt: cardFromDb.created_at,
    };
}

function CreateCardsModelArray(cardsFromDb) {
    return cardsFromDb.map(CreateCardsModel);
}

export default class CardsDomain {
    constructor() {
        this.db = database;
        this.config = config;
    }

    async createCard({
        name,
        icon,
        sound = null,
        descr,
        attack,
        defence,
        cost,
        attribute
    }) {
        const card = {
            id:         uuidv4(),
            name:       name,
            icon:       icon,
            sound:      sound,
            descr:      descr,
            attack:     attack,
            defence:    defence,
            cost:       cost,
            attribute:  attribute,
            created_at: new Date(),
        };

        if (!card.name) {
            throw new InvalidCardDataError('Card name is required and must be unique');
        }
        if (!card.icon) {
            throw new InvalidCardDataError('Card icon is required');
        }
        if (!card.descr) {
            throw new InvalidCardDataError('Card description is required');
        }
        if (!card.attack || card.attack < 0 || card.attack > 10) {
            throw new InvalidCardDataError('Card attack is required must be greater than or equal to 0 and less than or equal to 10');
        }
        if (!card.defence || card.defence < 0 || card.defence > 10) {
            throw new InvalidCardDataError('Card defence is required must be greater than or equal to 0 and less than or equal to 10');
        }
        if (!card.cost || card.cost <= 0 || card.cost > 10) {
            throw new InvalidCardDataError('Card cost is required must be greater than or equal to 0 and less than or equal to 10');
        }
        if (!card.attribute || (
            card.attribute !== "strange" && card.attribute !== "agility" && card.attribute !== "intellect")
        ) {
            throw new InvalidCardDataError('Card attribute is required or invalid');
        }
        if (card.attack < 0 || card.attack > 10) {
            throw new InvalidCardDataError('Card attack must be greater than or equal to 0 and less than or equal to 10');
        }
        if (card.defence < 0 || card.defence > 10) {
            throw new InvalidCardDataError('Card defence must be greater than or equal to 0 and less than or equal to 10');
        }
        if (card.cost < 0 || card.cost > 10) {
            throw new InvalidCardDataError('Card cost must be greater than or equal to 0 and less than or equal to 10');
        }

        if (await this.db.cards().filterName(card.name).get()) {
            throw new CardAlreadyExistsError('Card with this name already exists');
        }

        await this.db.cards().insert(card);

        return CreateCardsModel(card);
    }

    async getAllCards() {
        const cards = await this.db.cards().select();

        return CreateCardsModelArray(cards);
    }

    async getCardById(id) {
        const card = await this.db.cards().filterById(id).get();

        if (!card) {
            throw new CardNotFoundError('Card not found');
        }

        return CreateCardsModel(card);
    }

    async deleteCard(id) {
        const card = await this.db.cards().filterById(id).get();

        if (!card) {
            throw new CardNotFoundError('Card not found');
        }

        await this.db.cards().filterById(id).delete();
    }

}