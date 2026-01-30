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
        .nexus-header {
            position: fixed; top: 0; left: 0; width: 100%; height: 75px;
            background: #050505; border-bottom: 1px solid #1a1a1a;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 12px; z-index: 10000; box-shadow: 0 4px 20px rgba(0,0,0,0.8);
            font-family: 'Rajdhani', sans-serif;
        }
        .user-pill { display: flex; align-items: center; gap: 10px; }
        .u-av { width: 45px; height: 45px; border-radius: 12px; border: 2px solid #00f2ff; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; background: #111; box-shadow: inset 0 0 10px #00f2ff44; }
        .u-det { font-family: 'Orbitron'; font-size: 0.65rem; color: #fff; line-height: 1.4; }
        .stats-row { display: flex; gap: 10px; font-size: 0.6rem; font-weight: 700; margin-top: 2px; }
        .u-np { color: #00ff88; text-shadow: 0 0 5px #00ff8844; }
        .u-bids { color: #ffcc00; text-shadow: 0 0 5px #ffcc0044; }
        
        .xp-container { width: 110px; height: 6px; background: #222; border-radius: 10px; margin-top: 5px; position: relative; overflow: hidden; border: 1px solid #333; }
        .xp-bar { height: 100%; background: linear-gradient(90deg, #bd00ff, #ff0055); width: 0%; transition: 1s cubic-bezier(0.17, 0.67, 0.83, 0.67); }
        .lvl-txt { font-size: 0.55rem; color: #00f2ff; font-weight: bold; }

        .ctrl-group { display: flex; align-items: center; gap: 10px; }
        .btn-recarga { background: linear-gradient(135deg, #00ff88, #009955); color: #000; border: none; padding: 6px 12px; border-radius: 6px; font-family: 'Orbitron'; font-size: 0.6rem; font-weight: 900; cursor: pointer; transition: 0.3s; }
        .btn-recarga:active { transform: scale(0.95); }
        
        .mode-toggle { width: 36px; height: 20px; background: #1a1a1a; border-radius: 20px; position: relative; cursor: pointer; border: 1px solid #333; }
        .mode-toggle::after { content: '🌙'; position: absolute; left: 3px; top: 2px; font-size: 10px; transition: 0.3s; }
        body.light-mode .mode-toggle::after { content: '☀️'; left: 19px; }

        .nexus-chat-fab { position: fixed; bottom: 85px; right: 20px; width: 55px; height: 55px; background: #ff0055; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; z-index: 9999; cursor: pointer; box-shadow: 0 5px 20px rgba(255,0,85,0.5); border: 2px solid #fff2; }
        .chat-panel { position: fixed; bottom: 150px; right: 20px; width: 300px; height: 400px; background: #0a0a0ae6; backdrop-filter: blur(15px); border: 1px solid #ff005566; border-radius: 20px; display: none; flex-direction: column; z-index: 10000; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .chat-panel.active { display: flex; animation: slideUp 0.3s ease; }
        
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .chat-msg-item { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 12px; padding: 8px; border-radius: 10px; background: rgba(255,255,255,0.03); }
        .chat-av { width: 30px; height: 30px; background: #000; border-radius: 5px; display: flex; align-items: center; justify-content: center; border: 1px solid #00f2ff; font-size: 0.9rem; }
        .chat-body { flex: 1; }
        .chat-name { font-size: 0.6rem; color: #00f2ff; font-family: 'Orbitron'; margin-bottom: 2px; }
        .chat-text { font-size: 0.8rem; color: #ddd; line-height: 1.2; }
    `;
    document.head.appendChild(style);

    const ui = document.createElement('div');
    ui.innerHTML = `
        <div class="nexus-header">
            <div class="user-pill">
                <div class="u-av" id="nav-av">👤</div>
                <div class="u-det">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span id="nav-name">SISTEMA</span>
                        <span class="lvl-txt" id="nav-lvl">LVL 1</span>
                    </div>
                    <div class="stats-row">
                        <span class="u-np" id="nav-np">0 NP</span>
                        <span class="u-bids" id="nav-bids">0 BIDS</span>
                    </div>
                    <div class="xp-container">
                        <div class="xp-bar" id="nav-xp"></div>
                    </div>
                </div>
            </div>
            <div class="ctrl-group">
                <button class="btn-recarga" onclick="window.location.href='deposito.html'">RECARGA</button>
                <div class="mode-toggle" id="theme-btn"></div>
                <button onclick="window.location.href='config.html'" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">⚙️</button>
            </div>
        </div>
        <div class="nexus-chat-fab" id="chat-fab">💬</div>
        <div class="chat-panel" id="chat-panel">
            <div style="background:#ff0055; padding:12px; font-family:Orbitron; font-size:0.7rem; color:#fff; display:flex; justify-content:space-between; align-items:center;">
                <span>NEXUS WORLD CHAT</span>
                <span style="cursor:pointer; font-size:1rem;" onclick="document.getElementById('chat-panel').classList.remove('active')">×</span>
            </div>
            <div id="chat-msgs" style="flex:1; overflow-y:auto; padding:15px; background:transparent;"></div>
            <div style="padding:12px; display:flex; gap:8px; background: rgba(0,0,0,0.4);">
                <input id="chat-in" type="text" placeholder="Digite aqui..." style="flex:1; background:#111; color:#fff; border:1px solid #333; padding:10px; border-radius:10px; font-size:0.8rem; outline:none;">
                <button id="chat-go" style="background:#ff0055; border:none; color:#fff; border-radius:10px; padding:0 15px; cursor:pointer; font-weight:bold;">➤</button>
            </div>
        </div>
    `;
    document.body.prepend(ui);

    // Variáveis de controle de Level
    let currentLvl = 1;
    let userData = {};

    document.getElementById('theme-btn').onclick = () => document.body.classList.toggle('light-mode');
    document.getElementById('chat-fab').onclick = () => {
        document.getElementById('chat-panel').classList.toggle('active');
        const msgs = document.getElementById('chat-msgs');
        msgs.scrollTop = msgs.scrollHeight;
    };

    onAuthStateChanged(auth, user => {
        if (user) {
            onSnapshot(doc(db, "usuarios", user.uid), async snap => {
                if(snap.exists()){
                    const d = snap.data();
                    userData = d; // Salva para o chat
                    
                    const xpTotal = d.xp || 0;
                    const level = Math.floor(xpTotal / 1000) + 1;
                    const xpNoNivel = xpTotal % 1000;
                    const percentual = (xpNoNivel / 1000) * 100;

                    // Lógica de Recompensa por subir de nível
                    if(level > currentLvl && currentLvl !== 0) {
                        await updateDoc(doc(db, "usuarios", user.uid), {
                            saldo: increment(10)
                        });
                        alert(`🔥 LEVEL UP! Você alcançou o nível ${level} e ganhou 10 NP!`);
                    }
                    currentLvl = level;

                    document.getElementById('nav-name').innerText = (d.nome || "PLAYER").toUpperCase().split(' ')[0];
                    document.getElementById('nav-av').innerText = d.avatarEmoji || "👤";
                    document.getElementById('nav-np').innerText = Math.floor(d.saldo || 0) + " NP";
                    document.getElementById('nav-bids').innerText = (d.bids || 0) + " BIDS";
                    document.getElementById('nav-lvl').innerText = "LVL " + level;
                    document.getElementById('nav-xp').style.width = percentual + "%";
                }
            });

            const sendMsg = async () => {
                const input = document.getElementById('chat-in');
                const text = input.value.trim();
                if(text !== "") {
                    await addDoc(collection(db, "global_chat"), {
                        text: text,
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
            const isMe = m.uid === auth.currentUser?.uid;
            const item = document.createElement('div');
            item.className = "chat-msg-item";
            item.style.borderLeft = isMe ? "2px solid #ff0055" : "2px solid #00f2ff";
            
            item.innerHTML = `
                <div class="chat-av">${m.avatar || "👤"}</div>
                <div class="chat-body">
                    <div class="chat-name">${isMe ? "VOCÊ" : (m.nome || "Membro").toUpperCase()}</div>
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
