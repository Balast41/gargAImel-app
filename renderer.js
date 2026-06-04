const btn     = document.getElementById('menuButton');
console.log(btn);
const menu    = document.getElementById('menu');
console.log(menu);
const overlay = document.getElementById('overlay');
console.log(overlay);
const filebutton = document.getElementById('fileButton');
console.log(filebutton);


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


filebutton.addEventListener('click', () => {
  window.api.openFileDialog().then(filePath => {
    if (filePath) {
      console.log('Fichier sélectionné :', filePath);
    }
  });
});

document.getElementById('minimizeButton').addEventListener('click', () => {
  window.api.minimize();
});

document.getElementById('maximizeButton').addEventListener('click', () => {
  window.api.maximize();
});

document.getElementById('closeButton').addEventListener('click', () => {
  window.api.close();
});


function navigate(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

function addMessage(text, sender = 'user') {
  const messages = document.getElementById('messages');
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

document.getElementById('sendButton').addEventListener('click', () => {
  const userInput = document.getElementById('userRequest').value.trim();
  if (!userInput) return;

  console.log('Requête utilisateur :', userInput);
  addMessage(userInput, 'user');
  document.getElementById('userRequest').value = '';
  navigate('page-discussion');
}
);

document.getElementById('sendButtonDiscussion').addEventListener('click', () => {
  const userInput = document.getElementById('userRequestDiscussion').value.trim();
  if (!userInput) return;

  addMessage(userInput, 'user');
  document.getElementById('userRequestDiscussion').value = '';
});

document.getElementById('newChatButton').addEventListener('click', () => {
  document.getElementById('messages').innerHTML = '';
  navigate('page-accueil');
});