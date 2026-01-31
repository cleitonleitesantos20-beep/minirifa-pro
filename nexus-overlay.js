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
        * { box-sizing: border-box; }
        body { margin: 0; padding-top: 75px; transition: background 0.3s; background: #050505; color: #fff; }
        body.light-mode { background: #f5f5f5 !important; color: #000 !important; }

        .nexus-header {
            position: fixed; top: 0; left: 0; width: 100%; height: 75px;
            background: #050505 !important; border-bottom: 1px solid #1a1a1a;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 10px; z-index: 10000; font-family: 'Rajdhani', sans-serif; color: #fff !important;
        }

        .user-pill { display: flex; align-items: center; gap: 8px; }
        .u-av { width: 40px; height: 40px; border-radius: 10px; border: 2px solid #00f2ff; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; background: #111; cursor: pointer; position: relative; }
        .u-det { font-family: 'Orbitron'; font-size: 0.58rem; line-height: 1.2; }
        .stats-row { display: flex; gap: 6px; font-weight: 700; }
        .u-np { color: #00ff88; }
        .u-bids { color: #ffcc00; }
        
        .xp-group { display: flex; align-items: center; gap: 4px; margin-top: 2px; }
        .xp-container { width: 70px; height: 5px; background: #222; border-radius: 4px; overflow: hidden; border: 1px solid #333; }
        .xp-bar { height: 100%; background: linear-gradient(90deg, #bd00ff, #ff0055); width: 0%; transition: 1s; }
        .xp-num { font-size: 0.45rem; color: #aaa; }
        .bonus-tag { font-size: 0.45rem; color: #ff0055; font-weight: bold; animation: pulse 1.5s infinite; }

        /* SELETOR DE EMOJIS */
        .emoji-picker {
            position: absolute; top: 80px; left: 10px; background: #0a0a0a; border: 1px solid #333;
            border-radius: 12px; padding: 10px; display: none; grid-template-columns: repeat(4, 1fr);
            gap: 8px; z-index: 10001; box-shadow: 0 10px 30px rgba(0,0,0,0.8); width: 180px;
        }
        .emoji-picker.active { display: grid; }
        .emoji-item { 
            width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; 
            background: #151515; border-radius: 5px; cursor: pointer; font-size: 1.1rem; position: relative;
        }
        .emoji-item.locked { opacity: 0.4; cursor: not-allowed; }
        .emoji-item.locked::after { content: '🔒'; position: absolute; font-size: 0.5rem; bottom: 2px; right: 2px; }

        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

        .ctrl-group { display: flex; align-items: center; gap: 10px; }
        .btn-recarga { background: linear-gradient(135deg, #00ff88, #009955); color: #000; border: none; padding: 5px 10px; border-radius: 5px; font-family: 'Orbitron'; font-size: 0.55rem; font-weight: 900; cursor: pointer; }
        .mode-toggle { width: 32px; height: 16px; background: #333; border-radius: 10px; position: relative; cursor: pointer; border: 1px solid #444; }
        .mode-toggle::after { content: '🌙'; position: absolute; left: 2px; top: 1px; font-size: 8px; transition: 0.3s; }
        body.light-mode .mode-toggle::after { content: '☀️'; left: 18px; }

        .nexus-chat-fab { position: fixed; bottom: 15px; right: 15px; width: 45px; height: 45px; background: #ff0055; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; z-index: 9999; cursor: pointer; }
        .chat-panel { position: fixed; bottom: 70px; right: 15px; width: 260px; height: 350px; background: #0a0a0ae6; backdrop-filter: blur(10px); border: 1px solid #ff005566; border-radius: 12px; display: none; flex-direction: column; z-index: 10000; color: #fff; }
        .chat-panel.active { display: flex; }
        
        .chat-msg-item { display: flex; gap: 6px; margin-bottom: 8px; padding: 5px; background: rgba(255,255,255,0.05); border-radius: 6px; }
        .chat-name { font-size: 0.5rem; color: #00f2ff; font-family: 'Orbitron'; }
        .chat-text { font-size: 0.7rem; word-break: break-word; }
    `;
    document.head.appendChild(style);

    const ui = document.createElement('div');
    ui.innerHTML = `
        <div class="nexus-header">
            <div class="user-pill">
                <div class="u-av" id="nav-av">👤</div>
                <div class="emoji-picker" id="emoji-picker"></div>
                <div class="u-det">
                    <div style="display:flex; justify-content:space-between; min-width:80px;">
                        <span id="nav-name">...</span>
                        <span style="color:#00f2ff;" id="nav-lvl">L1</span>
                    </div>
                    <div class="stats-row">
                        <span class="u-np" id="nav-np">0 NP</span>
                        <span class="u-bids" id="nav-bids">0 BIDS</span>
                    </div>
                    <div class="xp-group">
                        <div class="xp-container"><div class="xp-bar" id="nav-xp"></div></div>
                        <span class="xp-num" id="xp-val">0/1000</span>
                        <span class="bonus-tag">+10NP</span>
                    </div>
                </div>
            </div>
            <div class="ctrl-group">
                <button class="btn-recarga" onclick="window.location.href='deposito.html'">RECARGA</button>
                <div class="mode-toggle" id="theme-btn"></div>
            </div>
        </div>
        <div class="nexus-chat-fab" id="chat-fab">💬</div>
        <div class="chat-panel" id="chat-panel">
            <div style="background:#ff0055; padding:8px; font-family:Orbitron; font-size:0.55rem; display:flex; justify-content:space-between;">
                <span>NEXUS CHAT</span>
                <span style="cursor:pointer" onclick="document.getElementById('chat-panel').classList.remove('active')">×</span>
            </div>
            <div id="chat-msgs" style="flex:1; overflow-y:auto; padding:10px;"></div>
            <div style="padding:8px; display:flex; gap:4px; background:rgba(0,0,0,0.3);">
                <input id="chat-in" type="text" placeholder="Mensagem..." style="flex:1; background:#000; color:#fff; border:1px solid #333; padding:6px; border-radius:5px; font-size:0.7rem; outline:none;">
                <button id="chat-go" style="background:#ff0055; border:none; color:#fff; border-radius:5px; padding:0 10px; cursor:pointer;">➤</button>
            </div>
        </div>
    `;
    document.body.prepend(ui);

    // Configuração de Emojis
    const emojisDisponiveis = ["👤", "🔥", "💎", "⚡", "👑", "🚀", "🎮", "👾", "🤖", "👻", "🦄", "💀"];
    const emojisGratis = ["👤", "🔥"]; // Apenas exemplos que começam liberados

    let currentLvl = 0;
    let userData = {};

    document.getElementById('theme-btn').onclick = () => document.body.classList.toggle('light-mode');
    document.getElementById('chat-fab').onclick = () => document.getElementById('chat-panel').classList.toggle('active');
    
    // Abrir/Fechar Seletor de Emoji
    const navAv = document.getElementById('nav-av');
    const picker = document.getElementById('emoji-picker');
    navAv.onclick = (e) => { e.stopPropagation(); picker.classList.toggle('active'); };
    document.addEventListener('click', () => picker.classList.remove('active'));

    onAuthStateChanged(auth, user => {
        if (user) {
            onSnapshot(doc(db, "usuarios", user.uid), async snap => {
                if(snap.exists()){
                    const d = snap.data();
                    userData = d;
                    
                    // Atualiza Interface
                    const xpTotal = d.xp || 0;
                    const level = Math.floor(xpTotal / 1000) + 1;
                    const xpNoNivel = xpTotal % 1000;

                    if(currentLvl !== 0 && level > currentLvl) {
                        await updateDoc(doc(db, "usuarios", user.uid), { saldo: increment(10) });
                        alert(`UP! Nível ${level}: +10 NP!`);
                    }
                    currentLvl = level;

                    document.getElementById('nav-name').innerText = (d.nome || "PLAYER").toUpperCase().split(' ')[0];
                    document.getElementById('nav-av').innerText = d.avatarEmoji || "👤";
                    document.getElementById('nav-np').innerText = Math.floor(d.saldo || 0) + " NP";
                    document.getElementById('nav-bids').innerText = (d.bids || 0) + " BIDS";
                    document.getElementById('nav-lvl').innerText = "LVL " + level;
                    document.getElementById('nav-xp').style.width = (xpNoNivel / 10) + "%";
                    document.getElementById('xp-val').innerText = `${xpNoNivel}/1000`;

                    // Renderiza Emojis no Seletor
                    renderEmojiPicker(user.uid, d.mochilaEmojis || emojisGratis);
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

    function renderEmojiPicker(uid, mochila) {
        picker.innerHTML = "";
        emojisDisponiveis.forEach(emo => {
            const isLocked = !mochila.includes(emo);
            const item = document.createElement('div');
            item.className = `emoji-item ${isLocked ? 'locked' : ''}`;
            item.innerText = emo;
            
            item.onclick = async () => {
                if(isLocked) {
                    alert("Este emoji deve ser adquirido no Mercado!");
                    return;
                }
                await updateDoc(doc(db, "usuarios", uid), { avatarEmoji: emo });
                picker.classList.remove('active');
            };
            picker.appendChild(item);
        });
    }

    const q = query(collection(db, "global_chat"), orderBy("timestamp", "desc"), limit(30));
    onSnapshot(q, snap => {
        const box = document.getElementById('chat-msgs');
        box.innerHTML = "";
        snap.docs.reverse().forEach(doc => {
            const m = doc.data();
            const item = document.createElement('div');
            item.className = "chat-msg-item";
            item.innerHTML = `<div style="font-size:0.9rem">${m.avatar || "👤"}</div>
                <div><div class="chat-name">${(m.nome || "Membro").toUpperCase()}</div>
                <div class="chat-text">${m.text}</div></div>`;
            box.appendChild(item);
        });
        box.scrollTop = box.scrollHeight;
    });
}

if (document.readyState === "complete") { initOverlay(); } 
else { window.addEventListener("load", initOverlay); }
