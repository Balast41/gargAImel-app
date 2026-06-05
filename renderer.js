const overlay = document.getElementById('overlay');
console.log(overlay);
const filebutton = document.getElementById('fileButton');
console.log(filebutton);
const historique = window.api.readHistorique();
let currentConversationId = null;

async function loadHistorique() {
  const data = await window.api.readHistorique();
  const menuContent = document.getElementsByClassName('conversation-list')[0];
  menuContent.innerHTML = ''; // Clear existing items
  
  for (const conv of data) {
    const item = document.createElement('input');
    item.type = 'button';
    item.value = conv.resume || conv.date; // Fallback sur la date si pas de résumé
    menuContent.appendChild(item);
    item.addEventListener('click', () => loadChat(conv.id));
  }
}

loadHistorique();

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

let keys = {
  enter: false,
  shift: false
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter') keys.enter = true;
  if (e.key === 'Shift') keys.shift = true;

  if (e.key === 'Escape') closeNav();
  if (keys.enter && !keys.shift) {
    e.preventDefault();
    const userRequestID = document.getElementById('userRequest').value.trim() ? 'userRequest' : 'userRequestDiscussion';
    sendMessage(userRequestID);
  } 
});

addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    keys.enter = false;
  }
  if (e.key === "Shift") {
    keys.shift = false;
  }
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
  sendMessage('userRequest');
}
);

document.getElementById('sendButtonDiscussion').addEventListener('click', () => {
  sendMessage('userInputDiscussion');
});


async function sendMessage(requestID) {
  const userInput = document.getElementById(requestID).value.trim();
  if (!userInput) {
    console.log('Message vide, non envoyé.');
    return;
  }

  if (document.getElementById('page-chat').classList.contains('active')) {
    const messagesContent = document.getElementById('messages');
    messagesContent.innerHTML = ''; // Clear existing items
    console.log('Requête utilisateur :', userInput);
    addMessageUser(userInput, 'user');
    document.getElementById(requestID).value = "";
    navigate('page-discussion');
    currentConversationId = await window.api.saveHistorique();
    loadHistorique();
  } else {
    console.log('Requête utilisateur :', userInput);
    addMessageUser(userInput, 'user');
    document.getElementById(requestID).value = "";
  }
  await window.api.saveMessage({
    conversationId: currentConversationId,
    sender: 'user',
    content: userInput
  });
}

document.getElementById('newChatButton').addEventListener('click', () => {
  document.getElementById('messages').innerHTML = '';
  navigate('page-chat');
});

async function loadChat(conversationId) {
  const data = await window.api.readHistorique();
  const conv = data.find(c => c.id === conversationId);

  if (conv) {
    currentConversationId = conversationId;
    navigate('page-discussion');
    document.getElementById('messages').innerHTML = '';

    for (const msg of conv.messages) {
      if (msg.sender === 'user') {
        addMessageUser(msg.content);
      } else if (msg.sender === 'ia') {
        addMessageIA(msg.content);
      }
    }
  }
}

async function IAResponse(content) {
  addMessageIA(content, 'ia');
  await window.api.saveMessage({
  conversationId: currentConversationId,
  sender: 'ia',
  content: content
});
}

document.getElementById('newChatButton').addEventListener('click', () => {
  navigate('page-chat');
  closeNav();
});