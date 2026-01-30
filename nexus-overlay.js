import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, collection, addDoc, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
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
        .nexus-header {
            position: fixed; top: 0; left: 0; width: 100%; height: 70px;
            background: #0a0a0a; border-bottom: 1px solid #222;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 12px; z-index: 10000; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            font-family: 'Rajdhani', sans-serif;
        }
        .user-pill { display: flex; align-items: center; gap: 8px; }
        .u-av { width: 42px; height: 42px; border-radius: 50%; border: 2px solid #00f2ff; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; background: #000; cursor: default; }
        .u-det { font-family: 'Orbitron'; font-size: 0.65rem; color: #fff; line-height: 1.2; }
        .stats-row { display: flex; gap: 8px; font-size: 0.6rem; margin-top: 2px; }
        .u-np { color: #00ff88; font-weight: bold; }
        .u-bids { color: #ffcc00; font-weight: bold; }
        
        .xp-container { width: 100px; height: 4px; background: #222; border-radius: 2px; margin-top: 4px; position: relative; }
        .xp-bar { height: 100%; background: #bd00ff; border-radius: 2px; width: 0%; transition: 0.5s; }
        .lvl-txt { font-size: 0.5rem; color: #aaa; position: absolute; right: 0; top: -10px; }

        .ctrl-group { display: flex; align-items: center; gap: 8px; }
        .btn-dep { background: #00ff88; color: #000; border: none; padding: 5px 10px; border-radius: 5px; font-family: 'Orbitron'; font-size: 0.6rem; font-weight: bold; cursor: pointer; }
        .mode-toggle { width: 34px; height: 18px; background: #333; border-radius: 20px; position: relative; cursor: pointer; border: 1px solid #444; }
        .mode-toggle::after { content: '🌙'; position: absolute; left: 2px; top: 1px; font-size: 9px; transition: 0.3s; }
        body.light-mode .mode-toggle::after { content: '☀️'; left: 18px; }
        body.light-mode { background: #f0f0f0 !important; color: #000; }

        .nexus-chat-fab { position: fixed; bottom: 80px; right: 15px; width: 50px; height: 50px; background: #ff0055; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; z-index: 9999; cursor: pointer; box-shadow: 0 0 15px rgba(255,0,85,0.4); }
        .chat-panel { position: fixed; bottom: 140px; right: 15px; width: 280px; height: 350px; background: #111; border: 1px solid #ff0055; border-radius: 15px; display: none; flex-direction: column; z-index: 10000; overflow: hidden; }
        .chat-panel.active { display: flex; }
        .chat-msg-item { margin-bottom: 8px; padding: 5px; border-bottom: 1px solid #222; word-break: break-all; }
        .chat-name { font-size: 0.6rem; color: #ff0055; font-family: 'Orbitron'; display: block; }
    `;
    document.head.appendChild(style);

    const ui = document.createElement('div');
    ui.innerHTML = `
        <div class="nexus-header">
            <div class="user-pill">
                <div class="u-av" id="nav-av">👤</div>
                <div class="u-det">
                    <div style="display:flex; align-items:center; gap:5px;">
                        <span id="nav-name">...</span>
                        <span class="lvl-txt" id="nav-lvl">LVL 1</span>
                    </div>
                    <div class="stats-row">
                        <span class="u-np" id="nav-np">0 NP</span>
                        <span class="u-bids" id="nav-bids">0 BIDS</span>
                    </div>
                    <div class="xp-container"><div class="xp-bar" id="nav-xp"></div></div>
                </div>
            </div>
            <div class="ctrl-group">
                <button class="btn-dep" onclick="window.location.href='deposito.html'">DEPÓSITO</button>
                <div class="mode-toggle" id="theme-btn"></div>
                <button onclick="window.location.href='config.html'" style="background:none; border:none; font-size:1rem; cursor:pointer;">⚙️</button>
            </div>
        </div>
        <div class="nexus-chat-fab" id="chat-fab">💬</div>
        <div class="chat-panel" id="chat-panel">
            <div style="background:#ff0055; padding:8px; font-family:Orbitron; font-size:0.6rem; color:#fff; display:flex; justify-content:space-between;">
                <span>NEXUS CHAT</span>
                <span style="cursor:pointer" onclick="document.getElementById('chat-panel').classList.remove('active')">✖</span>
            </div>
            <div id="chat-msgs" style="flex:1; overflow-y:auto; padding:10px; color:#fff; font-size:0.75rem; background:#0a0a0a;"></div>
            <div style="padding:8px; display:flex; gap:5px; border-top:1px solid #222; background:#111;">
                <input id="chat-in" type="text" placeholder="Mensagem..." style="flex:1; background:#000; color:#fff; border:1px solid #333; padding:5px; border-radius:5px; font-size:0.75rem;">
                <button id="chat-go" style="background:#ff0055; border:none; color:#fff; border-radius:5px; padding:0 10px; cursor:pointer;">➤</button>
            </div>
        </div>
    `;
    document.body.prepend(ui);

    document.getElementById('theme-btn').onclick = () => document.body.classList.toggle('light-mode');
    document.getElementById('chat-fab').onclick = () => {
        const panel = document.getElementById('chat-panel');
        panel.classList.toggle('active');
        if(panel.classList.contains('active')) {
            const msgs = document.getElementById('chat-msgs');
            msgs.scrollTop = msgs.scrollHeight;
        }
    };

    onAuthStateChanged(auth, user => {
        if (user) {
            onSnapshot(doc(db, "usuarios", user.uid), snap => {
                if(snap.exists()){
                    const d = snap.data();
                    const xp = d.xp || 0;
                    const level = Math.floor(xp / 100) + 1;
                    const progress = xp % 100;

                    document.getElementById('nav-name').innerText = (d.nome || "USER").toUpperCase().split(' ')[0];
                    document.getElementById('nav-av').innerText = d.avatarEmoji || "👤";
                    document.getElementById('nav-np').innerText = Math.floor(d.saldo || 0) + " NP";
                    document.getElementById('nav-bids').innerText = (d.bids || 0) + " BIDS";
                    document.getElementById('nav-lvl').innerText = "LVL " + level;
                    document.getElementById('nav-xp').style.width = progress + "%";
                }
            });

            // Envio do Chat Corrigido
            const sendMsg = async () => {
                const input = document.getElementById('chat-in');
                const text = input.value.trim();
                if(text !== "") {
                    try {
                        await addDoc(collection(db, "global_chat"), {
                            text: text,
                            uid: user.uid,
                            nome: user.displayName || "Usuário",
                            timestamp: serverTimestamp()
                        });
                        input.value = "";
                    } catch (e) { console.error("Erro ao enviar:", e); }
                }
            };

            document.getElementById('chat-go').onclick = sendMsg;
            document.getElementById('chat-in').onkeypress = (e) => { if(e.key === 'Enter') sendMsg(); };
        } else { window.location.href = "login.html"; }
    });

    // Listener do Chat
    const q = query(collection(db, "global_chat"), orderBy("timestamp", "desc"), limit(30));
    onSnapshot(q, snap => {
        const box = document.getElementById('chat-msgs');
        box.innerHTML = "";
        snap.docs.reverse().forEach(doc => {
            const m = doc.data();
            const div = document.createElement('div');
            div.className = "chat-msg-item";
            div.innerHTML = `<span class="chat-name">${m.uid === auth.currentUser?.uid ? 'VOCÊ' : 'Membro'}</span>${m.text}`;
            box.appendChild(div);
        });
        box.scrollTop = box.scrollHeight;
    });
}

if (document.readyState === "complete") { initOverlay(); } 
else { window.addEventListener("load", initOverlay); }
