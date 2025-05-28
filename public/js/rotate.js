// let dragged = null;
// let ghost = null;
// let offsetX = 0;
// let offsetY = 0;
// let originHolder = null;

// document.querySelectorAll('.card_with_stats').forEach(card => {
//   card.addEventListener('mousedown', (e) => {
//     if (!card.closest('.player_cards')) return;
//     e.preventDefault();
//     dragged = card;
//     originHolder = card.parentElement; // Запоминаем родителя для возврата
//     document.body.style.cursor = 'grabbing';

//     // Получаем позицию и размеры карточки
//     const rect = card.getBoundingClientRect();

//     // Создаём клон (ghost) с позицией "как есть" на экране
//     ghost = card.cloneNode(true);
//     ghost.style.position = 'fixed';
//     ghost.style.left = rect.left + 'px';
//     ghost.style.top = rect.top + 'px';
//     ghost.style.width = rect.width + 'px';
//     ghost.style.height = rect.height + 'px';
//     ghost.style.pointerEvents = 'none';
//     ghost.style.zIndex = 10000;
//     ghost.style.opacity = 0.95;

//     document.body.appendChild(ghost);

//     // Сохраняем смещение между точкой клика и верхним левым углом карточки
//     offsetX = e.clientX - rect.left;
//     offsetY = e.clientY - rect.top;

//     // Скрываем оригинал (можно скрывать или уменьшать opacity)
//     card.style.opacity = 0.3;

//     document.addEventListener('mousemove', onMouseMove);
//     document.addEventListener('mouseup', onMouseUp);
//   });
// });

// function onMouseMove(e) {
//   if (ghost) {
//     ghost.style.left = (e.clientX - offsetX) + 'px';
//     ghost.style.top = (e.clientY - offsetY) + 'px';
//   }
// }

// function onMouseUp(e) {
//   if (!ghost || !dragged) return;
//   document.body.style.cursor = '';

//   // Проверяем, попал ли курсор в player_battle
//   const battleZone = document.getElementById('player_battle');
//   const battleRect = battleZone.getBoundingClientRect();

//   if (
//     e.clientX >= battleRect.left &&
//     e.clientX <= battleRect.right &&
//     e.clientY >= battleRect.top &&
//     e.clientY <= battleRect.bottom
//   ) {
//     // Перемещаем ОРИГИНАЛЬНЫЙ элемент (не ghost!) в player_battle
//     dragged.style.opacity = "";
//     battleZone.appendChild(dragged);
//   } else {
//     // Возвращаем назад (или оставляем как было)
//     dragged.style.opacity = "";
//     originHolder.appendChild(dragged);
//   }

//   // Удаляем ghost
//   ghost.remove();
//   ghost = null;
//   dragged = null;

//   document.removeEventListener('mousemove', onMouseMove);
//   document.removeEventListener('mouseup', onMouseUp);
// }
// --- DRAG-AND-DROP with delegation ---
let dragged   = null;   // .card_with_stats being dragged
let origin    = null;   // its original .card_holder
let ghostImg  = null;
let dropOK    = false;

const hand    = document.querySelector('.player_cards');   // parent of all cards
const battle  = document.getElementById('player_battle');

// listen once – works for every card now and in the future
hand.addEventListener('dragstart', e => {
  const card = e.target.closest('.card_with_stats');
  if (!card) return;                // not a card

  dragged = card;
  origin  = card.parentElement;
  dropOK  = false;

  // ----- custom ghost (optional) -----
  const rect = card.getBoundingClientRect();
  ghostImg   = card.cloneNode(true);
  Object.assign(ghostImg.style, {
    width  : rect.width  + 'px',
    height : rect.height + 'px',
    opacity: '0.85',
    position: 'absolute',
    top: '-9999px',
    left: '-9999px'
  });
  document.body.appendChild(ghostImg);
  e.dataTransfer.setDragImage(ghostImg, e.offsetX, e.offsetY);

});

hand.addEventListener('dragend', () => {
  ghostImg?.remove();
  ghostImg = null;
  dragged?.style.removeProperty('opacity');

  if (!dropOK && dragged && origin) origin.appendChild(dragged);
  dragged = origin = null;
});

// ---------- drop zone ----------
battle.addEventListener('dragover', e => {
  if (dragged) e.preventDefault();  // allow drop
});

battle.addEventListener('drop', () => {
  if (!dragged) return;
  battle.appendChild(dragged);
  dropOK = true;
});
