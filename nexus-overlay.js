// ARQUIVO: nexus-overlay.js
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, collection, addDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAYO5RWaJy5y7r7jvzFk3wq-ByqM_dWWO8",
    authDomain: "minharifadigital.firebaseapp.com",
    projectId: "minharifadigital",
    appId: "1:59630725905:web:396c8cfca385dc3d957ab0"
};

// Inicialização segura do Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// Função que constrói o sistema visual
function injectNexusSystem() {
    // 1. Injeta o CSS Global
    const style = document.createElement('style');
    style.textContent = `
        :root { --bg-nav: #111; --neon: #00f2ff; --pink: #ff0055; --green: #00ff88; --txt: #fff; }
        body.light-mode { --bg-nav: #fff; --txt: #000; --border: #ddd; }
        
        .nexus-top-bar { 
            position: fixed; top: 0; left: 0; width: 100%; height: 70px; 
            background: var(--bg-nav); border-bottom: 1px solid #222; 
            display: flex; align-items: center; justify-content: space-between; 
            padding: 0 15px; z-index: 10000; box-sizing: border-box;
            box-shadow: 0 2px 15px rgba(0,0,0,0.5);
        }
        .user-block { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .u-avatar { width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--neon); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; background: #000; }
        .u-info { font-family: 'Orbitron'; line-height: 1.2; }
        .u-info b { display: block; font-size: 0.7rem; color: var(--txt); }
        .u-info span { font-size: 0.6rem; color: var(--green); }

        .nexus-btns { display: flex; align-items: center; gap: 10px; }
        .n-btn { background: #222; border: 1px solid #333; color: #fff; width: 35px; height: 35px; border-radius: 8px; cursor: pointer; }
        
        /* Alavanca de Tema */
        .t-switch { position: relative; width: 40px; height: 20px; background: #333; border-radius: 20px; cursor: pointer; }
        .t-circle { position: absolute; width: 16px; height: 16px; background: #fff; border-radius: 50%; top: 2px; left: 2px; transition: 0.3s; }
        body.light-mode .t-switch { background: var(--neon); }
        body.light-mode .t-circle { left: 22px; }

        .chat-btn { position: fixed; bottom: 80px; right: 20px; width: 55px; height: 55px; background: var(--pink); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; z-index: 9999; cursor: pointer; box-shadow: 0 5px 15px rgba(255,0,85,0.4); }
        .chat-box { position: fixed; bottom: 145px; right: 20px; width: 300px; height: 350px; background: var(--bg-nav); border: 1px solid var(--pink); border-radius: 15px; display: none; flex-direction: column; z-index: 10000; overflow: hidden; }
        .chat-box.open { display: flex; }
    `;
    document.head.appendChild(style);

    // 2. Injeta o HTML
    const overlay = document.createElement('div');
    overlay.innerHTML = `
        <div class="nexus-top-bar">
            <div class="user-block" onclick="window.location.href='perfil.html'">
                <div class="u-avatar" id="nav-avatar">👤</div>
                <div class="u-info"><b id="nav-nome">CARREGANDO...</b><span id="nav-np">0 NP</span></div>
            </div>
            <div class="nexus-btns">
                <button class="n-btn" onclick="window.location.href='deposito.html'">💰</button>
                <div class="t-switch" onclick="document.body.classList.toggle('light-mode')"><div class="t-circle"></div></div>
                <button class="n-btn" onclick="window.location.href='config.html'">⚙️</button>
            </div>
        </div>
        <div class="chat-btn" onclick="document.getElementById('nexus-chat').classList.toggle('open')">💬</div>
        <div class="chat-box" id="nexus-chat">
            <div style="background:var(--pink); padding:10px; font-family:Orbitron; font-size:0.7rem;">CHAT GLOBAL NEXUSVL</div>
            <div id="chat-msg-area" style="flex:1; overflow-y:auto; padding:10px; font-size:0.8rem;"></div>
            <div style="padding:10px; display:flex; gap:5px; border-top:1px solid #333;">
                <input id="chat-txt" type="text" style="flex:1; background:#000; color:#fff; border:1px solid #444; padding:5px; border-radius:5px;">
                <button id="chat-send" style="background:var(--pink); border:none; color:#fff; border-radius:5px; padding:0 10px;">➤</button>
            </div>
        </div>
    `;
    document.body.prepend(overlay);

    // 3. Lógica Firebase
    onAuthStateChanged(auth, (user) => {
        if (user) {
            onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
                const d = snap.data();
                if(d) {
                    document.getElementById('nav-nome').innerText = (d.nome || "OPERADOR").toUpperCase();
                    document.getElementById('nav-avatar').innerText = d.avatarEmoji || "👤";
                    document.getElementById('nav-np').innerText = Math.floor(d.saldo || 0) + " NP";
                }
            });
        }
    });

    // Lógica simples do Chat
    document.getElementById('chat-send').onclick = async () => {
        const input = document.getElementById('chat-txt');
        if(!input.value || !auth.currentUser) return;
        await addDoc(collection(db, "global_chat"), {
            text: input.value, uid: auth.currentUser.uid, timestamp: new Date().toISOString()
        });
        input.value = "";
    };

    const q = query(collection(db, "global_chat"), orderBy("timestamp", "desc"), limit(20));
    onSnapshot(q, (snap) => {
        const area = document.getElementById('chat-msg-area');
        area.innerHTML = "";
        snap.docs.reverse().forEach(d => {
            const m = d.data();
            area.innerHTML += `<div style="margin-bottom:8px; color:${m.uid === auth.currentUser?.uid ? 'var(--neon)' : '#ccc'}">${m.text}</div>`;
        });
        area.scrollTop = area.scrollHeight;
    });
}

// Garante que a injeção só ocorra quando o BODY existir
if (document.body) {
    injectNexusSystem();
} else {
    window.addEventListener('DOMContentLoaded', injectNexusSystem);
}
