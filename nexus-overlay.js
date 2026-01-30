import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, collection, addDoc, query, orderBy, limit, serverTimestamp, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
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
    const style = document.createElement('style');
    style.textContent = `
        /* Reset para evitar que elementos saiam da tela */
        * { box-sizing: border-box; }
        
        body { 
            margin: 0; 
            padding-top: 75px; /* Espaço para a header fixa */
            transition: background 0.3s, color 0.3s;
            background: #050505; color: #fff;
        }

        /* Tema Light afeta apenas o corpo da página, não a header */
        body.light-mode { background: #f5f5f5 !important; color: #000 !important; }

        .nexus-header {
            position: fixed; top: 0; left: 0; width: 100%; height: 75px;
            background: #050505 !important; /* Sempre escuro */
            border-bottom: 1px solid #1a1a1a;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 12px; z-index: 10000; box-shadow: 0 4px 20px rgba(0,0,0,0.8);
            font-family: 'Rajdhani', sans-serif; color: #fff !important;
        }

        .user-pill { display: flex; align-items: center; gap: 8px; }
        .u-av { width: 42px; height: 42px; border-radius: 10px; border: 2px solid #00f2ff; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; background: #111; }
        .u-det { font-family: 'Orbitron'; font-size: 0.6rem; color: #fff !important; line-height: 1.2; }
        .stats-row { display: flex; gap: 8px; font-size: 0.55rem; font-weight: 700; }
        .u-np { color: #00ff88; }
        .u-bids { color: #ffcc00; }
        
        .xp-group { display: flex; align-items: center; gap: 4px; margin-top: 2px; }
        .xp-container { width: 80px; height: 6px; background: #222; border-radius: 4px; position: relative; overflow: hidden; border: 1px solid #333; }
        .xp-bar { height: 100%; background: linear-gradient(90deg, #bd00ff, #ff0055); width: 0%; transition: 1s; }
        .xp-num { font-size: 0.45rem; color: #aaa; min-width: 40px; }
        .bonus-tag { font-size: 0.5rem; color: #ff0055; font-weight: bold; animation: pulse 1.5s infinite; }

        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

        .btn-recarga { background: linear-gradient(135deg, #00ff88, #009955); color: #000; border: none; padding: 5px 10px; border-radius: 5px; font-family: 'Orbitron'; font-size: 0.55rem; font-weight: 900; cursor: pointer; }
        .mode-toggle { width: 34px; height: 18px; background: #333; border-radius: 20px; position: relative; cursor: pointer; border: 1px solid #444; }
        .mode-toggle::after { content: '🌙'; position: absolute; left: 2px; top: 1px; font-size: 10px; transition: 0.3s; }
        body.light-mode .mode-toggle::after { content: '☀️'; left: 18px; }

        .nexus-chat-fab { position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px; background: #ff0055; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; z-index: 9999; cursor: pointer; box-shadow: 0 5px 15px rgba(255,0,85,0.4); }
        .chat-panel { position: fixed; bottom: 80px; right: 20px; width: 280px; height: 380px; background: #0a0a0ae6; backdrop-filter: blur(15px); border: 1px solid #ff005566; border-radius: 15px; display: none; flex-direction: column; z-index: 10000; color: #fff; }
        .chat-panel.active { display: flex; }
        
        .chat-msg-item { display: flex; gap: 6px; margin-bottom: 10px; padding: 6px; background: rgba(255,255,255,0.05); border-radius: 8px; }
        .chat-av { font-size: 1rem; }
        .chat-name { font-size: 0.55rem; color: #00f2ff; font-family: 'Orbitron'; }
        .chat-text { font-size: 0.75rem; word-break: break-word; }
    `;
    document.head.appendChild(style);

    const ui = document.createElement('div');
    ui.innerHTML = `
        <div class="nexus-header">
            <div class="user-pill">
                <div class="u-av" id="nav-av">👤</div>
                <div class="u-det">
                    <div style="display:flex; justify-content:space-between; width: 100%;">
                        <span id="nav-name">...</span>
                        <span style="color:#00f2ff; font-weight:bold" id="nav-lvl">LVL 1</span>
                    </div>
                    <div class="stats-row">
                        <span class="u-np" id="nav-np">0 NP</span>
                        <span class="u-bids" id="nav-bids">0 BIDS</span>
                    </div>
                    <div class="xp-group">
                        <div class="xp-container"><div class="xp-bar" id="nav-xp"></div></div>
                        <span class="xp-num" id="xp-val">0/1000</span>
                        <span class="bonus-tag">+10 NP</span>
                    </div>
                </div>
            </div>
            <div class="ctrl-group">
                <button class="btn-recarga" onclick="window.location.href='deposito.html'">RECARGA</button>
                <div class="mode-toggle" id="theme-btn"></div>
                <button onclick="window.location.href='config.html'" style="background:none; border:none; font-size:1.1rem; cursor:pointer; filter: grayscale(1) brightness(2);">⚙️</button>
            </div>
        </div>
        <div class="nexus-chat-fab" id="chat-fab">💬</div>
        <div class="chat-panel" id="chat-panel">
            <div style="background:#ff0055; padding:10px; font-family:Orbitron; font-size:0.6rem; color:#fff; display:flex; justify-content:space-between; align-items:center;">
                <span>NEXUS WORLD CHAT</span>
                <span style="cursor:pointer; font-size:1.2rem;" onclick="document.getElementById('chat-panel').classList.remove('active')">×</span>
            </div>
            <div id="chat-msgs" style="flex:1; overflow-y:auto; padding:12px; background: rgba(0,0,0,0.2);"></div>
            <div style="padding:10px; display:flex; gap:5px; background: rgba(0,0,0,0.4);">
                <input id="chat-in" type="text" placeholder="Escreva..." style="flex:1; background:#000; color:#fff; border:1px solid #333; padding:8px; border-radius:8px; font-size:0.7rem; outline:none;">
                <button id="chat-go" style="background:#ff0055; border:none; color:#fff; border-radius:8px; padding:0 12px; cursor:pointer;">➤</button>
            </div>
        </div>
    `;
    document.body.prepend(ui);

    let currentLvl = 0;
    let userData = {};

    document.getElementById('theme-btn').onclick = () => document.body.classList.toggle('light-mode');
    document.getElementById('chat-fab').onclick = () => {
        document.getElementById('chat-panel').classList.toggle('active');
    };

    onAuthStateChanged(auth, user => {
        if (user) {
            onSnapshot(doc(db, "usuarios", user.uid), async snap => {
                if(snap.exists()){
                    const d = snap.data();
                    userData = d;
                    
                    const xpTotal = d.xp || 0;
                    const level = Math.floor(xpTotal / 1000) + 1;
                    const xpNoNivel = xpTotal % 1000;

                    if(currentLvl !== 0 && level > currentLvl) {
                        await updateDoc(doc(db, "usuarios", user.uid), { saldo: increment(10) });
                        alert(`UP! Você agora é Nível ${level} e ganhou 10 NP!`);
                    }
                    currentLvl = level;

                    document.getElementById('nav-name').innerText = (d.nome || "PLAYER").toUpperCase().split(' ')[0];
                    document.getElementById('nav-av').innerText = d.avatarEmoji || "👤";
                    document.getElementById('nav-np').innerText = Math.floor(d.saldo || 0) + " NP";
                    document.getElementById('nav-bids').innerText = (d.bids || 0) + " BIDS";
                    document.getElementById('nav-lvl').innerText = "LVL " + level;
                    document.getElementById('nav-xp').style.width = (xpNoNivel / 10) + "%";
                    document.getElementById('xp-val').innerText = `${xpNoNivel}/1000`;
                }
            });

            const sendMsg = async () => {
                const input = document.getElementById('chat-in');
                if(input.value.trim() !== "") {
                    await addDoc(collection(db, "global_chat"), {
                        text: input.value,
                        uid: user.uid,
                        nome: userData.nome || "Membro",
                        avatar: userData.avatarEmoji || "👤",
                        timestamp: serverTimestamp()
                    });
                    input.value = "";
                }
            };
            document.getElementById('chat-go').onclick = sendMsg;
            document.getElementById('chat-in').onkeypress = (e) => { if(e.key === 'Enter') sendMsg(); };
        } else { window.location.href = "login.html"; }
    });

    const q = query(collection(db, "global_chat"), orderBy("timestamp", "desc"), limit(40));
    onSnapshot(q, snap => {
        const box = document.getElementById('chat-msgs');
        box.innerHTML = "";
        snap.docs.reverse().forEach(doc => {
            const m = doc.data();
            const item = document.createElement('div');
            item.className = "chat-msg-item";
            item.innerHTML = `
                <div class="chat-av">${m.avatar || "👤"}</div>
                <div>
                    <div class="chat-name">${(m.nome || "Membro").toUpperCase()}</div>
                    <div class="chat-text">${m.text}</div>
                </div>
            `;
            box.appendChild(item);
        });
        box.scrollTop = box.scrollHeight;
    });
}

if (document.readyState === "complete") { initOverlay(); } 
else { window.addEventListener("load", initOverlay); }
