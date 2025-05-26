````markdown````

## 🔐 Аутентификация

* JWT в `socket.handshake.auth.token` — формат `Bearer <token>` или просто `<token>`.
* При отсутствии или неверном токене сервер шлёт `error` и разрывает соединение.

---

## 🎯 События

### Клиент → Сервер

| Событие             | Payload               | Описание                                     |
| ------------------- | --------------------- | -------------------------------------------- |
| **playCardAttack**  | `{ cardId: string }`  | Атакующий кладёт карту на стол               |
| **playCardDefense** | `{ cardId: string }`  | Защитник кладёт карту на стол                |
| **endGame**         | `{ reason?: string }` | Добровольная сдача с необязательной причиной |
| **serverShutdown**  | `{ message: string }` | Уведомление о выключении сервера             |

### Сервер → Клиент

| Событие             | Payload                                                                 | Описание                                                                                                |                                           |
| ------------------- |-------------------------------------------------------------------------| ------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **error**           | `{ message: string }`                                                   | Любая ошибка (авторизация, логика, полная комната…)                                                     |                                           |
| **userConnect**     | `{ username: string }`                                                  | Новый игрок вошёл в комнату                                                                             |                                           |
| **waitingOpponent** | `{ username: string }`                                                  | Первый игрок ждёт второго                                                                               |                                           |
| **startGame**       | `{ id: string, session: GameSession }`                                  | Начало партии (ид и полный снимок состояния)                                                            |                                           |
| **cardPlayed**      | `{ side: "attack"}`                                                      | "defense", card: GameCard, nextStage: string }\`                                                        | Карта принята, переход к следующему этапу |
| **battleResult**    | `{ diff: number, attackCard: GameCard, defenseCard: GameCard }`         | Результат битвы (разница урона + используемые карты)                                                    |                                           |
| **hpUpdate**        | `{ attackHP: number, defenseHP: number }`                               | Текущее здоровье после применения урона                                                                 |                                           |
| **handingCards**    | `{ round: number, hands: { attack: GameCard[], defense: GameCard[] } }` | Раздача новых карт в начале раунда                                                                      |                                           |
| **endGame**         | `{ winner?: string[], reason: string }`                                 | Окончание партии: массив победителей (`["attack"]`, `["defense"]` или `["attack","defense"]`) и причина |                                           |

## 🔄 Жизненный цикл

```text
1) waitingOpponent → startGame
2) handingCards
3) playCardAttack → cardPlayed
4) playCardDefense → cardPlayed
5) battleResult → hpUpdate
6) handingCards (или endGame, если есть победитель)
→ повторять цикл, пока не закончится партия
```
