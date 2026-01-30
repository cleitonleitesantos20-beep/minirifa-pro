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
        :root { --bg: #050505; --text: #fff; --border: #1a1a1a; --panel: #0a0a0ae6; }
        body.light-mode { --bg: #f5f5f5; --text: #000; --border: #ddd; --panel: #ffffffe6; }

        .nexus-header {
            position: fixed; top: 0; left: 0; width: 100%; height: 75px;
            background: var(--bg); border-bottom: 1px solid var(--border);
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 12px; z-index: 10000; box-shadow: 0 4px 20px rgba(0,0,0,0.8);
            font-family: 'Rajdhani', sans-serif; color: var(--text);
        }
        .user-pill { display: flex; align-items: center; gap: 10px; }
        .u-av { width: 45px; height: 45px; border-radius: 12px; border: 2px solid #00f2ff; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; background: #111; }
        .u-det { font-family: 'Orbitron'; font-size: 0.65rem; color: var(--text); line-height: 1.4; }
        .stats-row { display: flex; gap: 10px; font-size: 0.6rem; font-weight: 700; }
        .u-np { color: #00ff88; }
        .u-bids { color: #ffcc00; }
        
        .xp-group { display: flex; align-items: center; gap: 5px; margin-top: 4px; }
        .xp-container { width: 90px; height: 8px; background: #222; border-radius: 4px; position: relative; overflow: hidden; border: 1px solid #333; }
        .xp-bar { height: 100%; background: linear-gradient(90deg, #bd00ff, #ff0055); width: 0%; transition: 1s; }
        .xp-num { font-size: 0.5rem; color: #aaa; min-width: 45px; }
        .bonus-tag { font-size: 0.55rem; color: #ff0055; font-weight: bold; animation: pulse 1.5s infinite; }

        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

        .btn-recarga { background: linear-gradient(135deg, #00ff88, #009955); color: #000; border: none; padding: 6px 12px; border-radius: 6px; font-family: 'Orbitron'; font-size: 0.6rem; font-weight: 900; cursor: pointer; }
        .mode-toggle { width: 36px; height: 20px; background: #333; border-radius: 20px; position: relative; cursor: pointer; }
        .mode-toggle::after { content: '🌙'; position: absolute; left: 3px; top: 2px; font-size: 10px; transition: 0.3s; }
        body.light-mode .mode-toggle::after { content: '☀️'; left: 19px; }

        .nexus-chat-fab { position: fixed; bottom: 85px; right: 20px; width: 55px; height: 55px; background: #ff0055; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; z-index: 9999; cursor: pointer; box-shadow: 0 5px 20px rgba(255,0,85,0.5); }
        .chat-panel { position: fixed; bottom: 150px; right: 20px; width: 300px; height: 400px; background: var(--panel); backdrop-filter: blur(15px); border: 1px solid #ff005566; border-radius: 20px; display: none; flex-direction: column; z-index: 10000; color: var(--text); }
        .chat-panel.active { display: flex; }
        
        .chat-msg-item { display: flex; gap: 8px; margin-bottom: 12px; padding: 8px; background: rgba(125,125,125,0.1); border-radius: 10px; }
        .chat-av { font-size: 1.2rem; }
        .chat-name { font-size: 0.6rem; color: #00f2ff; font-family: 'Orbitron'; }
        .chat-text { font-size: 0.8rem; }
    `;
    document.head.appendChild(style);

    const ui = document.createElement('div');
    ui.innerHTML = `
        <div class="nexus-header">
            <div class="user-pill">
                <div class="u-av" id="nav-av">👤</div>
                <div class="u-det">
                    <div style="display:flex; justify-content:space-between;">
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
            <div class="ctrl-group" style="display:flex; align-items:center; gap:10px;">
                <button class="btn-recarga" onclick="window.location.href='deposito.html'">RECARGA</button>
                <div class="mode-toggle" id="theme-btn"></div>
                <button onclick="window.location.href='config.html'" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">⚙️</button>
            </div>
        </div>
        <div class="nexus-chat-fab" id="chat-fab">💬</div>
        <div class="chat-panel" id="chat-panel">
            <div style="background:#ff0055; padding:12px; font-family:Orbitron; font-size:0.7rem; color:#fff; display:flex; justify-content:space-between;">
                <span>NEXUS WORLD CHAT</span>
                <span style="cursor:pointer" onclick="document.getElementById('chat-panel').classList.remove('active')">×</span>
            </div>
            <div id="chat-msgs" style="flex:1; overflow-y:auto; padding:15px;"></div>
            <div style="padding:12px; display:flex; gap:8px;">
                <input id="chat-in" type="text" placeholder="Mensagem..." style="flex:1; background:rgba(0,0,0,0.2); color:inherit; border:1px solid #333; padding:10px; border-radius:10px;">
                <button id="chat-go" style="background:#ff0055; border:none; color:#fff; border-radius:10px; padding:0 15px; cursor:pointer;">➤</button>
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
        }
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
