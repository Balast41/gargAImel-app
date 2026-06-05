async function loadHistorique() {
  const data = await window.api.readHistorique();
  console.log(data);
  
  for (const conv of data.historique) {
    console.log(conv);
    const item = document.createElement('input');
    item.type = 'button';
    item.value = conv.resume;
    document.getElementsByClassName('menu-content')[0].appendChild(item);
    item.addEventListener('click', () => loadChat(data.historique.indexOf(conv)));
  }
}

loadHistorique();



const overlay = document.getElementById('overlay');
console.log(overlay);
const filebutton = document.getElementById('fileButton');
console.log(filebutton);

function openNav() {
  document.getElementById('menu').style.width = "250px";
  document.getElementById('menu').style.left = "0";
  overlay.classList.add('show');
}

function closeNav() {
  document.getElementById('menu').style.width = "0px";
  document.getElementById('menu').style.left = "-50px";
  overlay.classList.remove('show');
}

overlay.addEventListener('click', closeNav);

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
  if (pageId === 'page-discussion') {
    document.getElementById('backButton').hidden = false;
  } else {
    document.getElementById('backButton').hidden = true;
  }
}

function addMessageUser(text, sender = 'user') {
  const messages = document.getElementById('messages');
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function addMessageIA(text, sender = 'ia') {
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
  addMessageUser(userInput, 'user');
  document.getElementById('userRequest').value = '';
  navigate('page-discussion');
}
);

document.getElementById('sendButtonDiscussion').addEventListener('click', () => {
  const userInput = document.getElementById('userRequestDiscussion').value.trim();
  if (!userInput) return;

  addMessageUser(userInput, 'user');
  document.getElementById('userRequestDiscussion').value = '';
});

document.getElementById('newChatButton').addEventListener('click', () => {
  document.getElementById('messages').innerHTML = '';
  navigate('page-chat');
});

async function loadChat(index){
  // Charger la conversation à partir de l'index
  // Afficher les messages dans la page de discussion
  const data = await window.api.readHistorique();
  const conv = data.historique[index];
  if (conv) {
    navigate('page-discussion');
    document.getElementById('messages').innerHTML = '';
    for (let i = 0; i < conv.user_conv.length; i++) {
      addMessageUser(conv.user_conv[i]);
      addMessageIA(conv.ia_conv[i]);
    }
  }
}