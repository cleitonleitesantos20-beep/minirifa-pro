import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, collection, addDoc, query, orderBy, limit, serverTimestamp, updateDoc, increment, getDocs, where, arrayUnion } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
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
    // Carregar tema salvo
    const savedTheme = localStorage.getItem('nexusTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }

    const style = document.createElement('style');
    style.textContent = `
        * { box-sizing: border-box; }
        body { margin: 0; padding-top: 75px; transition: background 0.3s; background: #050505; color: #fff; }
        
        /* TEMA CLARO FORÇADO (Persistente e Global) */
        body.light-mode { background: #f5f5f5 !important; color: #111 !important; }
        body.light-mode .nexus-header { background: #fff !important; color: #000 !important; border-bottom: 1px solid #ccc; }
        body.light-mode .container, body.light-mode .card, body.light-mode div:not(.nexus-header *):not(.chat-panel *):not(.mission-panel *) { 
            background-color: #f5f5f5; color: #000; 
        }

        .nexus-header {
            position: fixed; top: 0; left: 0; width: 100%; height: 75px;
            background: #050505; border-bottom: 1px solid #1a1a1a;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 10px; z-index: 10000; font-family: 'Rajdhani', sans-serif; color: #fff;
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

        /* SELETOR DE EMOJIS EXPANDIDO */
        .emoji-picker {
            position: absolute; top: 80px; left: 10px; background: #0a0a0a; border: 1px solid #333;
            border-radius: 12px; padding: 12px; display: none; grid-template-columns: repeat(5, 1fr);
            gap: 8px; z-index: 10001; box-shadow: 0 10px 30px rgba(0,0,0,0.9); width: 230px;
            max-height: 300px; overflow-y: auto;
        }
        .emoji-picker.active { display: grid; }
        .emoji-item { 
            width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; 
            background: #151515; border-radius: 8px; cursor: pointer; font-size: 1.2rem; position: relative;
            transition: 0.2s; border: 1px solid transparent;
        }
        .emoji-item:hover:not(.locked) { border-color: #00f2ff; background: #222; }
        .emoji-item.locked { opacity: 0.3; cursor: not-allowed; filter: grayscale(1); }
        .emoji-item.locked::after { content: '🔒'; position: absolute; font-size: 0.55rem; bottom: -2px; right: -2px; filter: none; opacity: 1; }

        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

        .ctrl-group { display: flex; align-items: center; gap: 10px; }
        .btn-recarga { background: linear-gradient(135deg, #00ff88, #009955); color: #000; border: none; padding: 5px 10px; border-radius: 5px; font-family: 'Orbitron'; font-size: 0.55rem; font-weight: 900; cursor: pointer; }
        .mode-toggle { width: 32px; height: 16px; background: #333; border-radius: 10px; position: relative; cursor: pointer; border: 1px solid #444; }
        .mode-toggle::after { content: '🌙'; position: absolute; left: 2px; top: 1px; font-size: 8px; transition: 0.3s; }
        body.light-mode .mode-toggle::after { content: '☀️'; left: 18px; }

        /* FAB CHAT (DIREITA) */
        .nexus-chat-fab { position: fixed; bottom: 15px; right: 15px; width: 45px; height: 45px; background: #ff0055; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; z-index: 9999; cursor: pointer; box-shadow: 0 0 10px #ff0055; }
        
        /* FAB MISSÕES (ESQUERDA) */
        .nexus-mission-fab { position: fixed; bottom: 15px; left: 15px; width: 45px; height: 45px; background: #00f2ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; z-index: 9999; cursor: pointer; box-shadow: 0 0 10px #00f2ff; color: #000; }

        /* PAINEL DE CHAT */
        .chat-panel { position: fixed; bottom: 70px; right: 15px; width: 280px; height: 400px; background: #0a0a0ae6; backdrop-filter: blur(10px); border: 1px solid #ff005566; border-radius: 12px; display: none; flex-direction: column; z-index: 10000; color: #fff; }
        .chat-panel.active { display: flex; }
        .chat-tabs { display: flex; background: rgba(0,0,0,0.5); border-bottom: 1px solid #333; }
        .chat-tab { flex: 1; padding: 8px; text-align: center; font-family: 'Orbitron'; font-size: 0.55rem; cursor: pointer; color: #666; }
        .chat-tab.active-tab { color: #fff; border-bottom: 2px solid #ff0055; background: rgba(255,0,85,0.1); }
        
        .chat-msg-item { display: flex; gap: 6px; margin-bottom: 8px; padding: 5px; background: rgba(255,255,255,0.05); border-radius: 6px; }
        .chat-name { font-size: 0.5rem; color: #00f2ff; font-family: 'Orbitron'; }
        .chat-text { font-size: 0.7rem; word-break: break-word; }
        
        /* PAINEL DE MISSÕES */
        .mission-panel { position: fixed; bottom: 70px; left: 15px; width: 280px; height: 400px; background: #0a0a0ae6; backdrop-filter: blur(10px); border: 1px solid #00f2ff66; border-radius: 12px; display: none; flex-direction: column; z-index: 10000; color: #fff; }
        .mission-panel.active { display: flex; }
        
        .mission-item { display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #222; font-family: 'Rajdhani'; font-size: 0.8rem; }
        .mission-check { font-size: 0.7rem; color: #00ff88; font-family: 'Orbitron'; cursor: pointer; border: 1px solid #00ff88; padding: 2px 6px; border-radius: 4px; }
        .mission-check.disabled { border-color: #444; color: #444; cursor: not-allowed; }

        .friends-list-item { padding: 8px; border-bottom: 1px solid #222; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.2s; }
        .friends-list-item:hover { background: rgba(255,255,255,0.05); }
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
        
        <div class="nexus-mission-fab" id="mission-fab">🎯</div>
        <div class="nexus-chat-fab" id="chat-fab">💬</div>

        <div class="mission-panel" id="mission-panel">
            <div style="background:#00f2ff; color:#000; padding:8px; font-family:Orbitron; font-size:0.55rem; display:flex; justify-content:space-between;">
                <span>CENTRAL DE MISSÕES</span>
                <span style="cursor:pointer" onclick="document.getElementById('mission-panel').classList.remove('active')">×</span>
            </div>
            <div class="chat-tabs">
                <div class="chat-tab active-tab" onclick="switchMissionTab('daily')">DIÁRIAS</div>
                <div class="chat-tab" onclick="switchMissionTab('monthly')">MENSAIS</div>
            </div>
            <div id="mission-content" style="flex:1; overflow-y:auto; padding:10px;">
                </div>
        </div>

        <div class="chat-panel" id="chat-panel">
            <div style="background:#ff0055; padding:8px; font-family:Orbitron; font-size:0.55rem; display:flex; justify-content:space-between;">
                <span id="chat-header-title">NEXUS CHAT</span>
                <span style="cursor:pointer" onclick="document.getElementById('chat-panel').classList.remove('active')">×</span>
            </div>
            <div class="chat-tabs">
                <div class="chat-tab active-tab" id="tab-global" onclick="switchChatTab('global')">GLOBAL</div>
                <div class="chat-tab" id="tab-friends" onclick="switchChatTab('friends')">AMIGOS</div>
            </div>
            
            <div id="chat-msgs" style="flex:1; overflow-y:auto; padding:10px;"></div>
            
            <div id="friends-area" style="display:none; flex:1; overflow-y:auto; padding:10px;">
                <button onclick="addFriendUI()" style="width:100%; background:#333; border:1px dashed #666; color:#fff; padding:5px; margin-bottom:10px; cursor:pointer;">+ ADD AMIGO (ID/COD)</button>
                <div id="friends-list"></div>
            </div>

            <div style="padding:8px; display:flex; gap:4px; background:rgba(0,0,0,0.3);" id="chat-input-area">
                <input id="chat-in" type="text" placeholder="Mensagem..." style="flex:1; background:#000; color:#fff; border:1px solid #333; padding:6px; border-radius:5px; font-size:0.7rem; outline:none;">
                <button id="chat-go" style="background:#ff0055; border:none; color:#fff; border-radius:5px; padding:0 10px; cursor:pointer;">➤</button>
            </div>
        </div>
    `;
    document.body.prepend(ui);

    // Variáveis Globais de Controle
    let currentChatMode = 'global'; // 'global' ou 'private'
    let currentPrivateUser = null;

    // CONFIGURAÇÃO DE EMOJIS
    const emojisDisponiveis = [
        "👤", "🔥", "🐱", "🐶", "🦊", 
        "💎", "⚡", "👑", "🚀", "🎮", "👾", "🤖", "👻", "🦄", "💀", "👽", "💊", "🔫", "💰", "🌈", "⭐", "🍀", "🧿", "👺", "🐱‍👤"
    ];
    const emojisIniciais = ["👤", "🔥", "🐱", "🐶", "🦊"]; 

    let currentLvl = 0;
    let userData = {};

    // LÓGICA DE TEMA (Fixada e Persistente)
    document.getElementById('theme-btn').onclick = () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('nexusTheme', isLight ? 'light' : 'dark');
    };

    // Toggles de Painéis
    document.getElementById('chat-fab').onclick = () => {
        document.getElementById('chat-panel').classList.toggle('active');
        document.getElementById('mission-panel').classList.remove('active');
    };
    document.getElementById('mission-fab').onclick = () => {
        document.getElementById('mission-panel').classList.toggle('active');
        document.getElementById('chat-panel').classList.remove('active');
        renderMissions('daily'); // Renderiza padrão
    };
    
    const navAv = document.getElementById('nav-av');
    const picker = document.getElementById('emoji-picker');
    navAv.onclick = (e) => { e.stopPropagation(); picker.classList.toggle('active'); };
    document.addEventListener('click', () => picker.classList.remove('active'));

    // GLOBAL FUNCTIONS (Para usar no HTML injetado)
    window.switchChatTab = (tab) => {
        document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active-tab'));
        if(tab === 'global') {
            document.getElementById('tab-global').classList.add('active-tab');
            document.getElementById('chat-msgs').style.display = 'block';
            document.getElementById('friends-area').style.display = 'none';
            document.getElementById('chat-input-area').style.display = 'flex';
            currentChatMode = 'global';
            loadGlobalChat();
        } else {
            document.getElementById('tab-friends').classList.add('active-tab');
            document.getElementById('chat-msgs').style.display = 'none';
            document.getElementById('friends-area').style.display = 'block';
            document.getElementById('chat-input-area').style.display = 'none'; // Esconde input na lista
            loadFriendsList();
        }
    };

    window.switchMissionTab = (type) => {
        renderMissions(type);
    };

    window.renderMissions = (type) => {
        const content = document.getElementById('mission-content');
        content.innerHTML = "";
        
        const hour = new Date().getHours();
        
        if (type === 'daily') {
            // Lógica de horários
            const canCheckDay = (hour >= 7 && hour < 19);
            const canCheckNight = (hour >= 19 || hour < 6);

            const missions = [
                { txt: "Check-in Dia (07h-18h)", active: canCheckDay, id: 'chk_day' },
                { txt: "Check-in Noite (19h-06h)", active: canCheckNight, id: 'chk_night' },
                { txt: "Jogar 10min (Games)", active: true, id: 'm_game' },
                { txt: "Visitar 3 Lojas", active: true, id: 'm_visit' },
                { txt: "Ler Notícias (2min)", active: true, id: 'm_news' },
                { txt: "Indicar 1 Amigo", active: true, id: 'm_ref' }
            ];

            missions.forEach(m => {
                const div = document.createElement('div');
                div.className = "mission-item";
                div.innerHTML = `
                    <span>${m.txt}</span>
                    <span class="mission-check ${m.active ? '' : 'disabled'}" onclick="${m.active ? `claimMission('${m.id}')` : ''}">
                        ${m.active ? 'RESGATAR (+2 XP)' : 'FECHADO'}
                    </span>
                `;
                content.appendChild(div);
            });
        } else {
            const missions = [
                { txt: "Participar de Drops", active: true, id: 'mm_drop' },
                { txt: "Campanha Nexus", active: true, id: 'mm_camp' },
                { txt: "Comprar no Mercado", active: true, id: 'mm_buy' }
            ];
            missions.forEach(m => {
                const div = document.createElement('div');
                div.className = "mission-item";
                div.innerHTML = `
                    <span>${m.txt}</span>
                    <span class="mission-check" onclick="claimMission('${m.id}')">RESGATAR (+2 XP)</span>
                `;
                content.appendChild(div);
            });
            
            const fullBonus = document.createElement('div');
            fullBonus.style.cssText = "margin-top:20px; text-align:center; border:1px dashed #ff0055; padding:10px; border-radius:8px;";
            fullBonus.innerHTML = "<div style='color:#ff0055; font-size:0.7rem'>BÔNUS MENSAL COMPLETO</div><div style='font-size:1.2rem; font-weight:bold'>+20 XP</div>";
            content.appendChild(fullBonus);
        }
    };

    window.claimMission = async (id) => {
        // Simulação de claim. Em produção, checar se já fez no banco de dados.
        await updateDoc(doc(db, "usuarios", auth.currentUser.uid), { xp: increment(2) });
        alert("Missão Concluída! +2 XP");
    };

    window.addFriendUI = async () => {
        const code = prompt("Digite o Código ou Nome exato do usuário:");
        if(!code) return;
        
        // Busca simples por nome (para ID seria ideal ter um campo uid direto ou codigo)
        const q = query(collection(db, "usuarios"), where("nome", "==", code));
        const snap = await getDocs(q);
        
        if(!snap.empty) {
            const friendDoc = snap.docs[0];
            await updateDoc(doc(db, "usuarios", auth.currentUser.uid), {
                amigos: arrayUnion({ uid: friendDoc.id, nome: friendDoc.data().nome, avatar: friendDoc.data().avatarEmoji })
            });
            alert("Amigo adicionado!");
            loadFriendsList();
        } else {
            alert("Usuário não encontrado (busque pelo nome exato do cadastro).");
        }
    };

    window.loadFriendsList = () => {
        const list = document.getElementById('friends-list');
        list.innerHTML = "";
        
        if(userData.amigos && userData.amigos.length > 0) {
            userData.amigos.forEach(f => {
                const item = document.createElement('div');
                item.className = "friends-list-item";
                item.innerHTML = `
                    <div style="font-size:1.2rem">${f.avatar || '👤'}</div>
                    <div style="flex:1">
                        <div style="font-size:0.7rem; color:#00f2ff">${f.nome}</div>
                        <div style="font-size:0.5rem; color:#666">Toque para conversar</div>
                    </div>
                `;
                item.onclick = () => openPrivateChat(f);
                list.appendChild(item);
            });
        } else {
            list.innerHTML = "<div style='text-align:center; padding:20px; color:#555'>Nenhum amigo adicionado.</div>";
        }
    };

    window.openPrivateChat = (friend) => {
        document.getElementById('friends-area').style.display = 'none';
        document.getElementById('chat-msgs').style.display = 'block';
        document.getElementById('chat-input-area').style.display = 'flex';
        document.getElementById('chat-header-title').innerText = `CHAT COM ${friend.nome.toUpperCase()}`;
        
        currentChatMode = 'private';
        currentPrivateUser = friend;
        
        const box = document.getElementById('chat-msgs');
        box.innerHTML = `<div style="text-align:center; color:#444; margin-top:50px;">Conversa privada criptografada com ${friend.nome}...<br>(Simulação Visual)</div>`;
    };

    // AUTH & DATA
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

                    renderEmojiPicker(user.uid, d.mochilaEmojis || emojisIniciais);
                }
            });

            const sendMsg = async () => {
                const input = document.getElementById('chat-in');
                const txt = input.value.trim();
                if(txt === "") return;

                if(currentChatMode === 'global') {
                    await addDoc(collection(db, "global_chat"), {
                        text: txt, uid: user.uid, nome: userData.nome || "Membro",
                        avatar: userData.avatarEmoji || "👤", timestamp: serverTimestamp()
                    });
                } else {
                    // Simulação de envio privado (apenas visual aqui, ideal seria coleção 'mensagens_privadas')
                    const box = document.getElementById('chat-msgs');
                    const item = document.createElement('div');
                    item.className = "chat-msg-item";
                    item.style.border = "1px solid #00f2ff";
                    item.innerHTML = `<div><div class="chat-name">VOCÊ -> ${currentPrivateUser.nome}</div><div class="chat-text">${txt}</div></div>`;
                    box.appendChild(item);
                }
                input.value = "";
            };
            document.getElementById('chat-go').onclick = sendMsg;
            document.getElementById('chat-in').onkeypress = (e) => { if(e.key === 'Enter') sendMsg(); };
            
            // Carrega chat global inicialmente
            loadGlobalChat();

        } else { window.location.href = "login.html"; }
    });

    function loadGlobalChat() {
        const q = query(collection(db, "global_chat"), orderBy("timestamp", "desc"), limit(30));
        onSnapshot(q, snap => {
            if(currentChatMode !== 'global') return; // Não atualiza se estiver em privado
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

    function renderEmojiPicker(uid, mochila) {
        picker.innerHTML = "";
        emojisDisponiveis.forEach(emo => {
            const isLocked = !mochila.includes(emo);
            const item = document.createElement('div');
            item.className = `emoji-item ${isLocked ? 'locked' : ''}`;
            item.innerText = emo;
            
            item.onclick = async () => {
                if(isLocked) {
                    alert("Bloqueado! Adquira este item no Nexus Market.");
                    return;
                }
                await updateDoc(doc(db, "usuarios", uid), { avatarEmoji: emo });
                picker.classList.remove('active');
            };
            picker.appendChild(item);
        });
    }
}

if (document.readyState === "complete") { initOverlay(); } 
else { window.addEventListener("load", initOverlay); }
