import Wiki from "./Wiki.js";
import config from "../../tools/config/Config.js";
import log from "../../tools/logger/Logger.js";
import {BadRequestError} from "../../tools/errors/AppError.js";
import {parseCreateCard} from "./requests.js";
import {renderCard, renderCardsCollection} from "./responses.js";

const cardsDomain = new Wiki();

export async function createCardHandler(req, res, next) {
    try {
        const { name, icon, sound, descr, attack, defence, cost, attribute } = parseCreateCard(req.body);

        const card = await cardsDomain.createCard({ name, icon, sound, descr, attack, defence, cost, attribute });

        log.info(`Card ${name} created`);
        res.status(201).json(renderCard(card));
    } catch (err) {
        next(err)
    }
}

export async function getCardHandler(req, res, next) {
    try {
        const card = await cardsDomain.getCardById(req.params.cardId);

        log.info(`Card ${req.params.cardId} fetched`);
        res.status(201).json(renderCard(card));
    } catch (err) {
        next(err)
    }
}

export async function deleteCardHandler(req, res, next) {
    try {
        await cardsDomain.deleteCard(req.params.cardId);

        log.info(`Card ${req.params.cardId} deleted`);
        res.status(204).end();
    } catch (err) {
        next(err)
    }
}

export async function getCardsHandler(req, res, next) {
    try {
        const cards = await cardsDomain.getAllCards();

        log.info(`Cards fetched`);
        res.status(200).json(renderCardsCollection(cards));
    } catch (err) {
        next(err)
    }
}