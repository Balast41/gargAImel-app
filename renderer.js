const overlay = document.getElementById('overlay');
console.log(overlay);
const filebutton = document.getElementById('fileButton');
console.log(filebutton);
const historique = window.api.readHistorique();
let currentConversationId = null;
let response = null;

function formatConversationDate(isoDate) {
  return new Date(isoDate).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFirstMessage(conv) {
  return conv.resume
    || conv.messages?.find((m) => m.sender === 'user')?.content
    || conv.messages?.[0]?.content;
}

function getConversationTitle(conv) {
  const firstMessage = getFirstMessage(conv);
  const date = formatConversationDate(conv.date);
  if (firstMessage) {
    const preview = firstMessage.length > 40 ? `${firstMessage.slice(0, 39)}…` : firstMessage;
    return `${preview} — ${date}`;
  }
  return date;
}

async function loadHistorique() {
  const data = await window.api.readHistorique();
  const menuContent = document.getElementsByClassName('conversation-list')[0];
  menuContent.innerHTML = '';

  for (const conv of data) {
    const item = document.createElement('input');
    item.type = 'button';
    const title = getConversationTitle(conv);
    item.value = title;
    item.title = getFirstMessage(conv) || conv.date;
    menuContent.appendChild(item);
    item.addEventListener('click', () => loadChat(conv.id));
  }
}

loadHistorique();

document.getElementById('searchInput').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const items = document.querySelectorAll('.conversation-list input');
  items.forEach(item => {
    const text = item.value.toLowerCase();
    item.type = text.includes(query) ? 'button' : 'hidden';
  });
});

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
    if ((document.getElementById('userRequest').value.trim() === "'; DROP TABLE messages; --") ||(document.getElementById('userRequestDiscussion').value.trim() === "'; DROP TABLE messages; --")) {
      console.log('Tentative d\'injection SQL détectée !');
      injectionSQL();

    }
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
  } else if (pageId === 'page-audio') {
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

function renderMarkdown(text) {
  const html = window.api.parseMarkdown(text);
  return DOMPurify.sanitize(html);
}

function addMessageIA(text, sender = 'ia') {
  const messages = document.getElementById('messages');
  const msg = document.createElement('div');
  msg.classList.add('message', sender, 'markdown');
  msg.innerHTML = renderMarkdown(text);
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function addMessageUserAudio(text, sender = 'user') {
  const messages = document.getElementById('messagesAudio');
  const msg = document.createElement('div');
  msg.classList.add('messageAudio', sender);
  msg.textContent = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}


function addMessageIAAudio(text, sender = 'ia') {
  const messages = document.getElementById('messagesAudio');
  const msg = document.createElement('div');
  msg.classList.add('message', sender, 'markdown');
  msg.innerHTML = renderMarkdown(text);
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


function showTypingIndicator() {
  const messages = document.getElementById('messages');
  const indicator = document.createElement('div');
  indicator.classList.add('typing-indicator');
  indicator.id = 'typingIndicator';
  indicator.innerHTML = '<span></span><span></span><span></span>';
  messages.appendChild(indicator);
  messages.scrollTop = messages.scrollHeight;
}

function removeTypingIndicator() {
  document.getElementById('typingIndicator')?.remove();
}

function showTypingIndicatorAudio() {
  const messages = document.getElementById('messagesAudio');
  const indicator = document.createElement('div');
  indicator.classList.add('typing-indicator');
  indicator.id = 'typingIndicator';
  indicator.innerHTML = '<span></span><span></span><span></span>';
  messages.appendChild(indicator);
  messages.scrollTop = messages.scrollHeight;
}

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
    currentConversationId = await window.api.saveHistorique(userInput,null);
    console.log('ID de la conversation créée :', currentConversationId);
    loadHistorique();
    showTypingIndicator();
    response = await window.api.sendPayload(userInput,currentConversationId);
    removeTypingIndicator();
  } else {
    console.log('Requête utilisateur :', userInput);
    addMessageUser(userInput, 'user');
    document.getElementById(requestID).value = "";
    showTypingIndicator();
    response = await window.api.sendPayload(userInput,currentConversationId);
    removeTypingIndicator();
  }
  await window.api.saveMessage({
    conversationId: currentConversationId,
    sender: 'user',
    content: userInput
  });
  await IAResponse();
}

document.getElementById('newChatButton').addEventListener('click', () => {
  document.getElementById('messages').innerHTML = '';
  navigate('page-chat');
});

document.getElementById('micButton').addEventListener('click', () => {
  navigate('page-audio');
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

async function IAResponse() {
  if (!response) {
    console.log('Aucune réponse de l\'IA disponible.');
    return;
  }
  addMessageIA(response, 'ia');
  await window.api.saveMessage({
  conversationId: currentConversationId,
  sender: 'ia',
  content: response
});
}

async function IAResponseAudio() {
  if (!response) {
    console.log('Aucune réponse de l\'IA disponible.');
    return;
  }
  addMessageIAAudio(response, 'ia');
  await window.api.saveMessage({
  conversationId: currentConversationId,
  sender: 'ia',
  content: response
});
}

document.getElementById('newChatButton').addEventListener('click', () => {
  navigate('page-chat');
  closeNav();
});

function textForTts(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*_>`\[\]()]/g, '')
    // Supprime les emojis et tout caractère hors BMP (> U+FFFF)
    .replace(/[\u{10000}-\u{10FFFF}]/gu, '')
    // Supprime aussi les emojis dans le BMP (ex: ☀️✅)
    .replace(/[\u2600-\u27BF\uFE00-\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

document.getElementById('sendButtonAudio').addEventListener('click', sendAudioMessage);
async function sendAudioMessage() {
  const input = document.getElementById('userRequestAudio');
  const prompt = input.value.trim();
  if (!prompt) return;
  input.value = '';
  // 1. Réponse IA (réutilise la logique chat)
  document.getElementById("gargAImelImg").hidden = true;
  addMessageUserAudio(prompt, 'user');
  currentConversationId = await window.api.saveHistorique(prompt,null);
  loadHistorique();
  console.log('Requête utilisateur (audio) :', prompt);
  const sessionId = currentConversationId ?? crypto.randomUUID();
  showTypingIndicatorAudio();
  response = await window.api.sendPayload(prompt, sessionId);
  await window.api.saveMessage({
    conversationId: currentConversationId,
    sender: 'user',
    content: prompt
  });
  // 2. TTS sur la réponse
  const spoken = textForTts(response);
  const wavBase64 = await window.api.generateTts(spoken);
  
  // 3. Lecture + visualisation
  await playWavBase64(wavBase64, () => IAResponseAudio());
  removeTypingIndicator();

}

// Malices de GargAImel

const konamiCode = [
  'ArrowUp','ArrowUp','ArrowDown','ArrowDown',
  'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight',
  'b','a'
];
let konamiIndex = 0;
let konamiActive = false;
let konamiTimeout = null;

document.addEventListener('keydown', (e) => {
  if (e.key === konamiCode[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      konamiIndex = 0;
      activateKonami();
    }
  } else {
    konamiIndex = 0;
  }
});

function activateKonami() {
  if (konamiActive) return;
  konamiActive = true;

  // Message d'intro
  const msg = document.createElement('div');
  msg.id = 'konamiMsg';
  msg.innerHTML = '🧪 MODE SORCIER ACTIVÉ<br><span style="font-size:0.8rem">Gargamel a pris le contrôle...</span>';
  document.body.appendChild(msg);
  var audio = new Audio('audio/konamiGarga.mp3');
  audio.play();

  // Applique le thème après l'affichage du message
  setTimeout(() => {
    msg.remove();
    document.body.classList.add('konami');
  }, 2000);

  // Retire le thème après 30 secondes
  if (konamiTimeout) clearTimeout(konamiTimeout);
  konamiTimeout = setTimeout(() => {
    document.body.classList.remove('konami');
    konamiActive = false;
  }, 30000);
}

let six_seven = ["6", "7"];
let six_sevenIndex = 0;
let six_sevenActive = false;

document.addEventListener('keydown', (e) => {
  if (e.key === six_seven[six_sevenIndex]) {
    six_sevenIndex++;
    if (six_sevenIndex === six_seven.length) {
      six_sevenIndex = 0;
      if(document.getElementById('userRequest').value.trim() === '' && document.getElementById('userRequestDiscussion').value.trim() === '') {
        activateSixSeven();
      }
    }
  } else {
    six_sevenIndex = 0;
  }
});

function activateSixSeven() {
  if (six_sevenActive) return;
  six_sevenActive = true;
  const page = document.body;
  var audio = new Audio('audio/67.mp3');
  audio.play();
  animate67(page);

  setTimeout(() => {
    six_sevenActive = false;
  }, 5000);
}

function animate67(element) {
  const totalSteps = 10;
  const maxAngle = 5;
  const frames = [];
 
  for (let i = 0; i <= totalSteps; i++) {
    const t = i / totalSteps;
    const decay = Math.pow(1 - t, 1.1);
    const sign = i % 2 === 0 ? 1 : -1;
    const angle = sign * decay * maxAngle;
 
    frames.push({
      transform: `rotateZ(${angle.toFixed(2)}deg)`,
      offset: t
    });
  }
 
  element.animate(frames, {
    duration: 2400,
    easing: 'ease-in-out',
    fill: 'forwards'
  }).onfinish = () => {
    element.style.transform = 'rotateZ(0deg)';
  };
}

function injectionSQL() {
  const msg = document.createElement('div');

  msg.id = 'sqlMsg';
  msg.innerHTML = `
    ⚠️ INJECTION SQL DÉTECTÉE<br>
    <span style="font-size:0.8rem">
      Suppression de la base de données...
    </span>
  `;

  Object.assign(msg.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#c62828',
    color: 'white',
    padding: '20px 30px',
    borderRadius: '10px',
    fontSize: '1.2rem',
    textAlign: 'center',
    zIndex: '99999',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
  });

  document.body.appendChild(msg);

  setTimeout(() => {
    msg.remove();
  }, 3000); // disparaît après 3 secondes
}