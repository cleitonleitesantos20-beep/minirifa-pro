// ARQUIVO: nexus-overlay.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, collection, addDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// --- CONFIGURAÇÃO FIREBASE (Mesma do seu projeto) ---
const firebaseConfig = {
    apiKey: "AIzaSyAYO5RWaJy5y7r7jvzFk3wq-ByqM_dWWO8",
    authDomain: "minharifadigital.firebaseapp.com",
    projectId: "minharifadigital",
    appId: "1:59630725905:web:396c8cfca385dc3d957ab0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentUser = null;
let userData = {};

// --- 1. INJEÇÃO DO CSS (ESTILO) ---
const style = document.createElement('style');
style.textContent = `
    :root { --bg-color: #000; --card-bg: #111; --text-color: #fff; --border-color: #222; --neon: #00f2ff; --pink: #ff0055; --green: #00ff88; --chat-bg: rgba(0,0,0,0.95); }
    body.light-mode { --bg-color: #e0e0e0; --card-bg: #fff; --text-color: #000; --border-color: #ccc; --chat-bg: rgba(255,255,255,0.95); }
    
    body { background-color: var(--bg-color); color: var(--text-color); transition: background 0.3s; padding-top: 70px !important; margin: 0; font-family: 'Rajdhani', sans-serif; }
    
    /* Header Fixo */
    .nexus-top-bar { position: fixed; top: 0; left: 0; width: 100%; height: 65px; background: var(--card-bg); border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; padding: 0 15px; z-index: 9999; box-shadow: 0 2px 10px rgba(0,0,0,0.5); box-sizing: border-box; }
    
    .user-profile-summary { display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .user-avatar-small { width: 38px; height: 38px; border-radius: 50%; background: #222; border: 1px solid var(--neon); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
    .user-details-small { display: flex; flex-direction: column; font-family: 'Orbitron'; }
    .user-details-small span { font-size: 0.75rem; font-weight: bold; }
    .user-details-small small { font-size: 0.6rem; color: #888; }
    
    .nexus-controls { display: flex; align-items: center; gap: 8px; }
    .ctrl-btn { background: var(--bg-color); border: 1px solid var(--border-color); color: var(--text-color); width: 35px; height: 35px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
    
    /* Toggle Switch */
    .theme-switch { position: relative; display: inline-block; width: 40px; height: 20px; }
    .theme-switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .4s; border-radius: 20px; border: 1px solid #555; }
    .slider:before { position: absolute; content: "🌙"; display: flex; align-items: center; justify-content: center; font-size: 10px; height: 16px; width: 16px; left: 2px; bottom: 1px; background-color: #000; transition: .4s; border-radius: 50%; color: #fff; }
    input:checked + .slider { background-color: var(--neon); }
    input:checked + .slider:before { transform: translateX(19px); content: "☀️"; background-color: #fff; color: #000; }

    /* Chat */
    .chat-fab { position: fixed; bottom: 20px; right: 20px; width: 55px; height: 55px; background: var(--pink); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; cursor: pointer; box-shadow: 0 0 15px var(--pink); z-index: 9998; }
    .chat-window { position: fixed; bottom: 85px; right: 20px; width: 300px; height: 400px; background: var(--chat-bg); border: 1px solid var(--pink); border-radius: 15px; display: none; flex-direction: column; z-index: 9999; backdrop-filter: blur(10px); }
    .chat-window.active { display: flex; }
    .chat-header { padding: 10px; background: var(--pink); color: #fff; display: flex; justify-content: space-between; border-radius: 14px 14px 0 0; font-family: 'Orbitron'; font-size: 0.8rem; }
    .chat-messages { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
    .chat-msg { padding: 5px 10px; border-radius: 8px; max-width: 85%; font-size: 0.85rem; }
    .chat-msg.me { background: rgba(0, 242, 255, 0.2); border: 1px solid var(--neon); align-self: flex-end; }
    .chat-msg.other { background: rgba(255, 255, 255, 0.1); border: 1px solid #444; align-self: flex-start; }
    .chat-user-name { font-size: 0.6rem; color: var(--neon); display: block; font-weight: bold; }
    .chat-input-area { padding: 10px; border-top: 1px solid var(--border-color); display: flex; gap: 5px; }
    #chat-input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-color); padding: 8px; border-radius: 5px; }
`;
document.head.appendChild(style);

// --- 2. INJEÇÃO DO HTML (ESTRUTURA) ---
const overlayHTML = `
    <div class="nexus-top-bar">
        <div class="user-profile-summary" onclick="window.location.href='perfil.html'">
            <div class="user-avatar-small" id="g-avatar">👤</div>
            <div class="user-details-small">
                <span id="g-nome">Carregando...</span>
                <small>LVL <span id="g-lvl">-</span> • <span id="g-np" style="color:var(--green)">-</span> NP</small>
            </div>
        </div>
        <div class="nexus-controls">
            <button class="ctrl-btn" onclick="window.location.href='deposito.html'">💰</button>
            <button class="ctrl-btn" onclick="window.location.href='config.html'">⚙️</button>
            <label class="theme-switch">
                <input type="checkbox" id="theme-toggle">
                <span class="slider round"></span>
            </label>
        </div>
    </div>

    <div class="chat-fab" id="fab-chat">💬</div>
    <div class="chat-window" id="chat-window">
        <div class="chat-header">
            <span>CHAT GLOBAL 🟢</span>
            <button id="close-chat" style="background:none;border:none;color:#fff;cursor:pointer;">✖</button>
        </div>
        <div class="chat-messages" id="chat-feed">
            <div style="text-align:center; color:#888; font-size:0.7rem;">Conectando ao chat...</div>
        </div>
        <div class="chat-input-area">
            <input type="text" id="chat-input" placeholder="Digite..." maxlength="100">
            <button id="send-btn" style="background:var(--pink);border:none;color:#fff;border-radius:5px;cursor:pointer;">➤</button>
        </div>
    </div>
`;

const overlayContainer = document.createElement('div');
overlayContainer.id = 'nexus-overlay-root';
overlayContainer.innerHTML = overlayHTML;
document.body.prepend(overlayContainer);

// --- 3. LÓGICA (JAVASCRIPT) ---

// Tema
const themeToggle = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('nexusTheme');
if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.checked = true;
}
themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('nexusTheme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
});

// Dados do Usuário
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        onSnapshot(doc(db, "usuarios", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                userData = docSnap.data();
                document.getElementById('g-nome').innerText = userData.nome || "Usuário";
                document.getElementById('g-avatar').innerText = userData.avatarEmoji || "👤";
                document.getElementById('g-lvl').innerText = userData.xp ? Math.floor(userData.xp / 100) + 1 : 1;
                document.getElementById('g-np').innerText = userData.saldo || 0;
            }
        });
    } else {
        // Se não tiver logado, pode redirecionar ou mostrar 'Visitante'
        document.getElementById('g-nome').innerText = "Visitante";
    }
});

// Chat
const fabChat = document.getElementById('fab-chat');
const closeChat = document.getElementById('close-chat');
const chatWindow = document.getElementById('chat-window');
const sendBtn = document.getElementById('send-btn');
const chatInput = document.getElementById('chat-input');
const chatFeed = document.getElementById('chat-feed');

function toggleChat() {
    chatWindow.classList.toggle('active');
    if(chatWindow.classList.contains('active')) scrollToBottom();
}

fabChat.addEventListener('click', toggleChat);
closeChat.addEventListener('click', toggleChat);

async function sendMessage() {
    const text = chatInput.value.trim();
    if(!text || !currentUser) return;
    
    try {
        await addDoc(collection(db, "global_chat"), {
            text: text,
            uid: currentUser.uid,
            nome: userData.nome || "Anônimo",
            emoji: userData.avatarEmoji || "👤",
            timestamp: new Date().toISOString()
        });
        chatInput.value = "";
        scrollToBottom();
    } catch(e) { console.error(e); }
}

sendBtn.addEventListener('click', sendMessage);

// Carregar mensagens
const q = query(collection(db, "global_chat"), orderBy("timestamp", "desc"), limit(50));
onSnapshot(q, (snapshot) => {
    chatFeed.innerHTML = '<div style="text-align:center; color:#666; font-size:0.6rem; padding:10px;">BEM-VINDO AO NEXUS CHAT</div>';
    const msgs = [];
    snapshot.forEach(doc => msgs.push(doc.data()));
    msgs.reverse();
    
    msgs.forEach(msg => {
        const div = document.createElement('div');
        const isMe = currentUser && msg.uid === currentUser.uid;
        div.className = `chat-msg ${isMe ? 'me' : 'other'}`;
        div.innerHTML = `<span class="chat-user-name">${msg.emoji} ${msg.nome}</span>${msg.text}`;
        chatFeed.appendChild(div);
    });
    scrollToBottom();
});

function scrollToBottom() {
    chatFeed.scrollTop = chatFeed.scrollHeight;
}
