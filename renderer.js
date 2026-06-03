const btn     = document.getElementById('menuButton');
console.log(btn);
const menu    = document.getElementById('menu');
console.log(menu);
const overlay = document.getElementById('overlay');
console.log(overlay);

function open() {
  menu.classList.add('show');
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function close() {
  menu.classList.remove('show');
  overlay.classList.remove('show');
  document.body.style.overflow = '';
}

btn.addEventListener('click', e => {
  e.stopPropagation();
  console.log('Menu button clicked');
  menu.classList.contains('show') ? close() : open();
});

overlay.addEventListener('click', close);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') close();
});