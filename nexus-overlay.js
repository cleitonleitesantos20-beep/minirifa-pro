import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, collection, addDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAYO5RWaJy5y7r7jvzFk3wq-ByqM_dWWO8",
    authDomain: "minharifadigital.firebaseapp.com",
    projectId: "minharifadigital",
    appId: "1:59630725905:web:396c8cfca385dc3d957ab0"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

function initOverlay() {
    // 1. Injeta CSS do Overlay
    const style = document.createElement('style');
    style.textContent = `
        .nexus-header {
            position: fixed; top: 0; left: 0; width: 100%; height: 75px;
            background: #0a0a0a; border-bottom: 1px solid #222;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 15px; z-index: 10000; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }
        .user-pill { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .u-av { width: 45px; height: 45px; border-radius: 50%; border: 2px solid #00f2ff; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; background: #000; }
        .u-det { font-family: 'Orbitron'; font-size: 0.7rem; color: #fff; line-height: 1.3; }
        .u-np { color: #00ff88; font-weight: bold; display: block; }
        
        .ctrl-group { display: flex; align-items: center; gap: 10px; }
        .mode-toggle { width: 40px; height: 20px; background: #333; border-radius: 20px; position: relative; cursor: pointer; border: 1px solid #444; }
        .mode-toggle::after { content: '🌙'; position: absolute; left: 2px; top: 1px; font-size: 10px; transition: 0.3s; }
        body.light-mode .mode-toggle::after { content: '☀️'; left: 22px; }
        body.light-mode { background: #f0f0f0 !important; color: #000; }

        .nexus-chat-fab { position: fixed; bottom: 80px; right: 20px; width: 55px; height: 55px; background: #ff0055; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; z-index: 9999; cursor: pointer; box-shadow: 0 0 15px rgba(255,0,85,0.4); }
        .chat-panel { position: fixed; bottom: 145px; right: 20px; width: 300px; height: 380px; background: #111; border: 1px solid #ff0055; border-radius: 15px; display: none; flex-direction: column; z-index: 10000; overflow: hidden; }
        .chat-panel.active { display: flex; }
    `;
    document.head.appendChild(style);

    // 2. Injeta HTML do Overlay
    const ui = document.createElement('div');
    ui.innerHTML = `
        <div class="nexus-header">
            <div class="user-pill" onclick="window.location.href='perfil.html'">
                <div class="u-av" id="nav-av">👤</div>
                <div class="u-det">
                    <span id="nav-name">CARREGANDO...</span>
                    <span class="u-np" id="nav-np">0 NP</span>
                </div>
            </div>
            <div class="ctrl-group">
                <div class="mode-toggle" id="theme-btn"></div>
                <button onclick="window.location.href='config.html'" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">⚙️</button>
            </div>
        </div>
        <div class="nexus-chat-fab" id="chat-fab">💬</div>
        <div class="chat-panel" id="chat-panel">
            <div style="background:#ff0055; padding:10px; font-family:Orbitron; font-size:0.7rem; color:#fff;">NEXUS CHAT</div>
            <div id="chat-msgs" style="flex:1; overflow-y:auto; padding:10px; color:#fff; font-size:0.8rem;"></div>
            <div style="padding:10px; display:flex; gap:5px; border-top:1px solid #222;">
                <input id="chat-in" type="text" placeholder="Sua mensagem..." style="flex:1; background:#000; color:#fff; border:1px solid #333; padding:5px; border-radius:5px;">
                <button id="chat-go" style="background:#ff0055; border:none; color:#fff; border-radius:5px; padding:0 10px;">➤</button>
            </div>
        </div>
    `;
    document.body.prepend(ui);

    // 3. Lógica de Tema e Chat
    document.getElementById('theme-btn').onclick = () => document.body.classList.toggle('light-mode');
    document.getElementById('chat-fab').onclick = () => document.getElementById('chat-panel').classList.toggle('active');

    // 4. Firebase Sync
    onAuthStateChanged(auth, user => {
        if (user) {
            onSnapshot(doc(db, "usuarios", user.uid), snap => {
                if(snap.exists()){
                    const d = snap.data();
                    document.getElementById('nav-name').innerText = (d.nome || "USER").toUpperCase();
                    document.getElementById('nav-av').innerText = d.avatarEmoji || "👤";
                    document.getElementById('nav-np').innerText = Math.floor(d.saldo || 0) + " NP";
                }
            });
        } else { window.location.href = "login.html"; }
    });
}

// Inicializa apenas quando o DOM estiver pronto
if (document.readyState === "complete") { initOverlay(); } 
else { window.addEventListener("load", initOverlay); }
