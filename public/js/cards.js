// public/js/cards.js

/**
 * Принимает объект card из API и возвращает <div class="card">…</div>
 */
export function renderCard(card) {
    const { attributes } = card;
    const {
        name,
        icon,
        sound,
        descr,
        attack,
        defence,
        cost,
        attribute
    } = attributes;

    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
    <!-- атакующий в левом-верхнем -->
    <div class="attack-container">
      <div class="attack-cost">${attack}</div>
    </div>

    <!-- обороняющийся в правом-верхнем -->
    <div class="defence-container">
      <div class="defence-cost">${defence}</div>
    </div>

    <!-- картинка, текст и атрибут -->
    <img class="card_icon" src="${icon}" alt="${name}">
    <h3>${name}</h3>
    <p>${descr}</p>
    <div class="attribute-icon attribute_${attribute}"></div>

    <!-- эликсир в левом-нижнем -->
    <div class="elixir-container">
      <div class="elixir-cost">${cost}</div>
    </div>
  `;
    return div;
}
