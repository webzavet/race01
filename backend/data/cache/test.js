// // backend/data/cache/test.js
// // Comprehensive Jest test suite for SessionStore (CommonJS)
// // Run: npx jest backend/data/cache/test.js
//
// const SessionStore = require('./sessions.js').default;
//
// const makeCard = (id) => ({
//     id,
//     name: `Card-${id}`,
//     icon: '',
//     sound: '',
//     descr: '',
//     attack: 3,
//     defence: 2,
//     cost: 2,
//     attribute: 'strength',
//     createdAt: Date.now(),
// });
//
// // Generate 20 cards for stress‑tests
// const cards = Array.from({ length: 20 }, (_, i) => makeCard(`c${i}`));
//
// const baseSession = () => ({
//     room: 'arena',
//     round: 1,
//     current_stage: 'attackTurn',
//     condition: 'playing',
//     players: {
//         attack: { username: 'p1', health: 20, elixir: 0, hand: [], table: [] },
//         defense: { username: 'p2', health: 20, elixir: 0, hand: [], table: [] },
//     },
//     deck: [...cards.slice(0, 10)],
//     discard: [],
//     timer: { duration: 30 },
// });
//
// describe('SessionStore – full exhaustive coverage', () => {
//     const sid = 'session‑x';
//     let store;
//
//     beforeEach(() => { store = new SessionStore(); });
//
//     /* ───────── validations ───────── */
//     test('invalid side throws', async () => {
//         await store.set(sid, baseSession());
//         await expect(store._sideUpdate(sid, 'left', 'health', 5))
//             .rejects.toThrow(/attack or defense/);
//     });
//
//     test('unknown session throws', async () => {
//         await expect(store.UpdateRound('ghost', 99)).rejects.toThrow(/not found/);
//     });
//
//     /* ───────── root field mutations ───────── */
//     test('repeated UpdateRound/Stage/Condition are idempotent', async () => {
//         await store.set(sid, baseSession());
//         for (let i = 1; i <= 5; i++) {
//             await store.UpdateRound(sid, i);
//             await store.UpdateStage(sid, i % 2 ? 'attackTurn' : 'defenseTurn');
//             await store.UpdateCondition(sid, i % 2 ? 'playing' : 'waiting');
//         }
//         const s = await store.get(sid);
//         expect(s.round).toBe(5);
//         expect(['attackTurn', 'defenseTurn']).toContain(s.current_stage);
//         expect(['playing', 'waiting']).toContain(s.condition);
//     });
//
//     test('SetTimer keeps latest value under concurrency', async () => {
//         await store.set(sid, baseSession());
//         await Promise.all([10, 20, 5, 55].map((t) => store.SetTimer(sid, t)));
//         const { timer } = await store.get(sid);
//         expect([10, 20, 5, 55]).toContain(timer.duration);
//     });
//
//     /* ───────── deck / discard operations ───────── */
//     test('SetDeck, RemoveFromDeck, AddToDiscard work under stress', async () => {
//         await store.set(sid, baseSession());
//
//         // Replace deck with 20 cards then remove all in random order
//         await store.SetDeck(sid, [...cards]);
//         const shuffled = [...cards].sort(() => Math.random() - 0.5);
//         for (const c of shuffled) {
//             await store.RemoveFromDeck(sid, c.id);
//         }
//         expect((await store.get(sid)).deck.length).toBe(0);
//
//         // Add duplicates to discard
//         await Promise.all([
//             store.AddToDiscard(sid, cards[0]),
//             store.AddToDiscard(sid, cards[0]),
//             store.AddToDiscard(sid, cards[1]),
//         ]);
//         const { discard } = await store.get(sid);
//         expect(discard.map(c => c.id)).toEqual(['c0', 'c0', 'c1']);
//     });
//
//     /* ───────── side granular setters ───────── */
//     test('Attack/Defence granular setters maintain latest value after many calls', async () => {
//         await store.set(sid, baseSession());
//
//         const healthVals = [18, 17, 10, 5];
//         const elixirVals = [0, 3, 7, 2];
//
//         await Promise.all([
//             ...healthVals.map(h => store.AttackSetHealth(sid, h)),
//             ...elixirVals.map(e => store.DefenceSetElixir(sid, e)),
//         ]);
//
//         const s = await store.get(sid);
//         expect(s.players.attack.health).toBe(healthVals.at(-1));
//         expect(s.players.defense.elixir).toBe(elixirVals.at(-1));
//     });
//
//     test('hand/table alternate updates keep last assigned card', async () => {
//         await store.set(sid, baseSession());
//         for (let i = 0; i < 5; i++) {
//             await store.AttackSetHand(sid, [cards[i]]);
//             await store.AttackSetTable(sid, [cards[i + 5]]);
//         }
//         const side = await store.AttackGet(sid);
//         expect(side.hand[0].id).toBe('c4');
//         expect(side.table[0].id).toBe('c9');
//     });
//
//     /* ───────── side replacement integrity ───────── */
//     test('DefenceSet + subsequent granular setters keep structure', async () => {
//         await store.set(sid, baseSession());
//         const newDef = {
//             username: 'guardian',
//             health: 22,
//             elixir: 4,
//             hand: [],
//             table: [],
//         };
//         await store.DefenceSet(sid, newDef);
//         await store.DefenceSetHand(sid, [cards[15]]);
//         await store.DefenceSetTable(sid, [cards[16]]);
//
//         const side = await store.DefenceGet(sid);
//         expect(side.username).toBe('guardian');
//         expect(side.hand[0].id).toBe('c15');
//         expect(side.table[0].id).toBe('c16');
//     });
//
//     /* ───────── prototype pollution guard ───────── */
//     test('update() ignores dangerous paths', async () => {
//         await store.set(sid, baseSession());
//         await store.update(sid, 'players.__proto__.polluted', true);
//         await store.update(sid, 'players.attack.constructor.bad', 'oops');
//         expect({}.polluted).toBeUndefined();
//     });
// });
