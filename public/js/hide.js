document.querySelector('.btn.play').addEventListener('click', () => {
    document.querySelector('.menu-box').style.display = 'none';
    document.querySelector('.game_starting').style.display = 'block';
  });

document.querySelector('#btn_back').addEventListener('click', () => {
    document.querySelector('.menu-box').style.display = 'block';
    document.querySelector('.game_starting').style.display = 'none';
  });