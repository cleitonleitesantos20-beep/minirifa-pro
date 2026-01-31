import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, collection, addDoc, query, orderBy, limit, serverTimestamp, updateDoc, increment, getDocs, where, arrayUnion, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
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
        
        /* TEMA CLARO FORÇADO */
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

        /* SELETOR DE EMOJIS */
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

        /* FABs */
        .nexus-chat-fab { position: fixed; bottom: 15px; right: 15px; width: 45px; height: 45px; background: #ff0055; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; z-index: 9999; cursor: pointer; box-shadow: 0 0 10px #ff0055; }
        .nexus-mission-fab { position: fixed; bottom: 15px; left: 15px; width: 45px; height: 45px; background: #00f2ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; z-index: 9999; cursor: pointer; box-shadow: 0 0 10px #00f2ff; color: #000; }

        /* CHAT PANEL */
        .chat-panel { position: fixed; bottom: 70px; right: 15px; width: 280px; height: 400px; background: #0a0a0ae6; backdrop-filter: blur(10px); border: 1px solid #ff005566; border-radius: 12px; display: none; flex-direction: column; z-index: 10000; color: #fff; }
        .chat-panel.active { display: flex; }
        .chat-tabs { display: flex; background: rgba(0,0,0,0.5); border-bottom: 1px solid #333; }
        .chat-tab { flex: 1; padding: 8px; text-align: center; font-family: 'Orbitron'; font-size: 0.55rem; cursor: pointer; color: #666; }
        .chat-tab.active-tab { color: #fff; border-bottom: 2px solid #ff0055; background: rgba(255,0,85,0.1); }
        .chat-msg-item { display: flex; gap: 6px; margin-bottom: 8px; padding: 5px; background: rgba(255,255,255,0.05); border-radius: 6px; }
        .chat-name { font-size: 0.5rem; color: #00f2ff; font-family: 'Orbitron'; }
        .chat-text { font-size: 0.7rem; word-break: break-word; }
        
        /* MISSIONS PANEL */
        .mission-panel { position: fixed; bottom: 70px; left: 15px; width: 280px; height: 400px; background: #0a0a0ae6; backdrop-filter: blur(10px); border: 1px solid #00f2ff66; border-radius: 12px; display: none; flex-direction: column; z-index: 10000; color: #fff; }
        .mission-panel.active { display: flex; }
        
        /* Checkin Semanal */
        .nexus-week-row { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #333; background: rgba(0,0,0,0.3); }
        .week-day { width: 25px; height: 25px; border-radius: 50%; border: 1px solid #444; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; color: #666; font-family: 'Orbitron'; }
        .week-day.today { border-color: #00f2ff; color: #fff; box-shadow: 0 0 5px #00f2ff; }
        .week-day.checked { background: #00ff88; color: #000 !important; border-color: #00ff88; }

        .mission-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #222; font-family: 'Rajdhani'; font-size: 0.8rem; position: relative; }
        .mission-item.locked-mission { opacity: 0.5; pointer-events: none; filter: grayscale(1); }
        .mission-check { font-size: 0.65rem; color: #00ff88; font-family: 'Orbitron'; cursor: pointer; border: 1px solid #00ff88; padding: 3px 8px; border-radius: 4px; transition: 0.2s; white-space: nowrap; }
        .mission-check:hover { background: #00ff88; color: #000; }
        .mission-check.done { background: transparent; border: none; font-size: 1rem; cursor: default; }
        .mission-check.disabled { border-color: #444; color: #444; cursor: not-allowed; }
        .lock-icon { margin-right: 5px; font-size: 0.9rem; }

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
            <div style="background:#00f2ff; color:#000; padding:8px; font-family:Orbitron; font-size:0.55rem; display:flex; justify-content:space-between; align-items:center;">
                <span>CENTRAL DE MISSÕES</span>
                <span style="cursor:pointer; font-size:1.2rem;" onclick="document.getElementById('mission-panel').classList.remove('active')">×</span>
            </div>
            <div class="chat-tabs">
                <div class="chat-tab active-tab" id="mtab-daily" onclick="switchMissionTab('daily')">DIÁRIAS</div>
                <div class="chat-tab" id="mtab-monthly" onclick="switchMissionTab('monthly')">MENSAIS</div>
            </div>
            <div class="nexus-week-row" id="week-row" style="display:flex;"></div>
            <div id="mission-content" style="flex:1; overflow-y:auto; padding:0;"></div>
        </div>

        <div class="chat-panel" id="chat-panel">
            <div style="background:#ff0055; padding:8px; font-family:Orbitron; font-size:0.55rem; display:flex; justify-content:space-between; align-items:center;">
                <span id="chat-header-title">NEXUS CHAT</span>
                <span style="cursor:pointer; font-size:1.2rem;" onclick="document.getElementById('chat-panel').classList.remove('active')">×</span>
            </div>
            <div class="chat-tabs">
                <div class="chat-tab active-tab" id="tab-global" onclick="switchChatTab('global')">GLOBAL</div>
                <div class="chat-tab" id="tab-friends" onclick="switchChatTab('friends')">AMIGOS</div>
            </div>
            
            <div id="chat-msgs" style="flex:1; overflow-y:auto; padding:10px;"></div>
            
            <div id="friends-area" style="display:none; flex:1; overflow-y:auto; padding:10px;">
                <button onclick="addFriendUI()" style="width:100%; background:#333; border:1px dashed #666; color:#fff; padding:8px; margin-bottom:10px; cursor:pointer; font-size:0.7rem;">+ ADD AMIGO (NOME)</button>
                <div id="friends-list"></div>
            </div>

            <div style="padding:8px; display:flex; gap:4px; background:rgba(0,0,0,0.3);" id="chat-input-area">
                <input id="chat-in" type="text" placeholder="Mensagem..." style="flex:1; background:#000; color:#fff; border:1px solid #333; padding:6px; border-radius:5px; font-size:0.7rem; outline:none;">
                <button id="chat-go" style="background:#ff0055; border:none; color:#fff; border-radius:5px; padding:0 10px; cursor:pointer;">➤</button>
            </div>
        </div>
    `;
    document.body.prepend(ui);

    // Variáveis Globais de Estado Local
    let currentChatMode = 'global';
    let currentPrivateUser = null;
    let currentMissionTab = 'daily';
    let userData = {};
    let currentLvl = 0;

    const emojisDisponiveis = [
        "👤", "🔥", "🐱", "🐶", "🦊", 
        "💎", "⚡", "👑", "🚀", "🎮", "👾", "🤖", "👻", "🦄", "💀", "👽", "💊", "🔫", "💰", "🌈", "⭐", "🍀", "🧿", "👺", "🐱‍👤"
    ];
    const emojisIniciais = ["👤", "🔥", "🐱", "🐶", "🦊"]; 

    // TEMA
    document.getElementById('theme-btn').onclick = () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('nexusTheme', isLight ? 'light' : 'dark');
    };

    // FAB Toggles
    document.getElementById('chat-fab').onclick = () => {
        document.getElementById('chat-panel').classList.toggle('active');
        document.getElementById('mission-panel').classList.remove('active');
    };
    document.getElementById('mission-fab').onclick = () => {
        const p = document.getElementById('mission-panel');
        p.classList.toggle('active');
        document.getElementById('chat-panel').classList.remove('active');
        if(p.classList.contains('active')) renderMissions(currentMissionTab);
    };
    
    const navAv = document.getElementById('nav-av');
    const picker = document.getElementById('emoji-picker');
    navAv.onclick = (e) => { e.stopPropagation(); picker.classList.toggle('active'); };
    document.addEventListener('click', () => picker.classList.remove('active'));

    // --- FUNÇÕES DE INTERFACE ---

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
            document.getElementById('chat-input-area').style.display = 'none'; 
            loadFriendsList();
        }
    };

    window.switchMissionTab = (type) => {
        currentMissionTab = type;
        document.getElementById('mtab-daily').className = `chat-tab ${type === 'daily' ? 'active-tab' : ''}`;
        document.getElementById('mtab-monthly').className = `chat-tab ${type === 'monthly' ? 'active-tab' : ''}`;
        renderMissions(type);
    };

    window.renderMissions = (type) => {
        const content = document.getElementById('mission-content');
        const weekRow = document.getElementById('week-row');
        content.innerHTML = "";
        weekRow.innerHTML = "";
        weekRow.style.display = type === 'daily' ? 'flex' : 'none';

        const now = new Date();
        const hour = now.getHours();
        const completedDaily = userData.daily_missions || [];
        const completedMonthly = userData.monthly_missions || [];
        
        // Renderizar Dias da Semana (Visual)
        if(type === 'daily') {
            const days = ['D','S','T','Q','Q','S','S'];
            const dayIndex = now.getDay();
            days.forEach((d, i) => {
                const el = document.createElement('div');
                el.className = `week-day ${i === dayIndex ? 'today' : ''}`;
                // Marcador de concluído se fez qualquer missão do dia
                if(i === dayIndex && completedDaily.length > 0) el.classList.add('checked');
                el.innerText = d;
                weekRow.appendChild(el);
            });
        }

        // Definição das Missões
        let missions = [];
        if (type === 'daily') {
            const canCheckDay = (hour >= 7 && hour < 19);
            const canCheckNight = (hour >= 19 || hour < 7);
            
            missions = [
                { txt: "Check-in Manhã (07h-18h)", id: 'chk_day', active: canCheckDay, isCheckin: true },
                { txt: "Check-in Noite (19h-06h)", id: 'chk_night', active: canCheckNight, isCheckin: true },
                { txt: "Jogar 10min (Games)", id: 'm_game', xp: 5 },
                { txt: "Visitar 3 Lojas", id: 'm_visit', xp: 5 },
                { txt: "Ler Notícias (2min)", id: 'm_news', xp: 5 },
                { txt: "Indicar 1 Amigo", id: 'm_ref', xp: 10 }
            ];
        } else {
            missions = [
                { txt: "Participar de 5 Drops", id: 'mm_drop', xp: 50 },
                { txt: "Campanha Nexus", id: 'mm_camp', xp: 100 },
                { txt: "Comprar no Mercado", id: 'mm_buy', xp: 30 }
            ];
        }

        const completedList = type === 'daily' ? completedDaily : completedMonthly;
        let isPreviousDone = true; 

        missions.forEach((m) => {
            const isDone = completedList.includes(m.id);
            const div = document.createElement('div');
            
            let locked = false;
            // Bloqueio sequencial apenas para missões que não são check-in
            if (!m.isCheckin && !isDone && !isPreviousDone) {
                locked = true;
            }

            // Atualiza status para a próxima missão (checkins não travam a sequência)
            if (!m.isCheckin) isPreviousDone = isDone; 

            div.className = `mission-item ${locked ? 'locked-mission' : ''}`;
            
            let btnHtml = "";
            if (isDone) {
                btnHtml = `<span class="mission-check done">✅</span>`;
            } else if (locked) {
                btnHtml = `<span class="mission-check disabled">🔒</span>`;
            } else if (m.isCheckin && !m.active) {
                btnHtml = `<span class="mission-check disabled" style="font-size:0.4rem">FORA HORÁRIO</span>`;
            } else {
                btnHtml = `<span class="mission-check" onclick="claimMission('${m.id}', '${type}', ${m.xp || 2})">RESGATAR</span>`;
            }

            div.innerHTML = `
                <div style="display:flex; align-items:center;">
                    ${locked ? '<span class="lock-icon">🔒</span>' : ''}
                    <span>${m.txt}</span>
                </div>
                ${btnHtml}
            `;
            content.appendChild(div);
        });
    };

    window.claimMission = async (id, type, xpVal) => {
        try {
            if(id.startsWith('chk_')) {
                const h = new Date().getHours();
                if(id === 'chk_day' && (h < 7 || h >= 19)) return alert("Horário de Brasília: Manhã é das 07h às 18:59h.");
                if(id === 'chk_night' && (h >= 7 && h < 19)) return alert("Horário de Brasília: Noite é das 19h às 06:59h.");
            }

            const field = type === 'daily' ? 'daily_missions' : 'monthly_missions';
            await updateDoc(doc(db, "usuarios", auth.currentUser.uid), { 
                xp: increment(xpVal),
                [field]: arrayUnion(id)
            });
        } catch (e) { console.error("Erro ao resgatar:", e); }
    };

    // --- AMIGOS E CHAT ---

    window.addFriendUI = async () => {
        const nameQuery = prompt("Digite o NOME exato do usuário:");
        if(!nameQuery) return;
        
        const q = query(collection(db, "usuarios"), where("nome", "==", nameQuery));
        const snap = await getDocs(q);
        
        if(!snap.empty) {
            const friendDoc = snap.docs[0];
            if(friendDoc.id === auth.currentUser.uid) return alert("Você não pode adicionar a si mesmo.");

            await updateDoc(doc(db, "usuarios", auth.currentUser.uid), {
                amigos: arrayUnion({ uid: friendDoc.id, nome: friendDoc.data().nome, avatar: friendDoc.data().avatarEmoji || '👤' })
            });
            alert(`Amigo ${nameQuery} adicionado!`);
            loadFriendsList();
        } else {
            alert("Usuário não encontrado.");
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
                        <div style="font-size:0.5rem; color:#666">Online agora</div>
                    </div>
                `;
                item.onclick = () => openPrivateChat(f);
                list.appendChild(item);
            });
        } else {
            list.innerHTML = "<div style='text-align:center; padding:20px; color:#555; font-size:0.7rem;'>Nenhum amigo adicionado.</div>";
        }
    };

    window.openPrivateChat = (friend) => {
        document.getElementById('friends-area').style.display = 'none';
        document.getElementById('chat-msgs').style.display = 'block';
        document.getElementById('chat-input-area').style.display = 'flex';
        document.getElementById('chat-header-title').innerText = `CHAT: ${friend.nome.toUpperCase()}`;
        currentChatMode = 'private';
        currentPrivateUser = friend;
        
        const box = document.getElementById('chat-msgs');
        box.innerHTML = `<div style="text-align:center; color:#444; margin-top:50px; font-size:0.7rem;">Criptografia ponta-a-ponta com ${friend.nome}...</div>`;
    };

    // --- MONITORAMENTO AUTH E DADOS ---

    onAuthStateChanged(auth, user => {
        if (user) {
            onSnapshot(doc(db, "usuarios", user.uid), async snap => {
                if(snap.exists()){
                    const d = snap.data();
                    userData = d;
                    
                    // Reset Temporal
                    const now = new Date();
                    const todayStr = now.toLocaleDateString('pt-BR');
                    const monthStr = `${now.getMonth()+1}/${now.getFullYear()}`;
                    let updates = {};
                    
                    if (d.last_daily_reset !== todayStr) {
                        updates.last_daily_reset = todayStr;
                        updates.daily_missions = [];
                    }
                    if (d.last_monthly_reset !== monthStr) {
                        updates.last_monthly_reset = monthStr;
                        updates.monthly_missions = [];
                    }
                    if (Object.keys(updates).length > 0) {
                        await updateDoc(doc(db, "usuarios", user.uid), updates);
                        return; 
                    }
                    
                    // Lógica de Nível
                    const xpTotal = d.xp || 0;
                    const level = Math.floor(xpTotal / 1000) + 1;
                    const xpNoNivel = xpTotal % 1000;

                    if(currentLvl !== 0 && level > currentLvl) {
                        await updateDoc(doc(db, "usuarios", user.uid), { saldo: increment(10) });
                        alert(`PARABÉNS! Você atingiu o Nível ${level} e ganhou +10 NP!`);
                    }
                    currentLvl = level;

                    // Atualizar UI
                    document.getElementById('nav-name').innerText = (d.nome || "PLAYER").toUpperCase().split(' ')[0];
                    document.getElementById('nav-av').innerText = d.avatarEmoji || "👤";
                    document.getElementById('nav-np').innerText = Math.floor(d.saldo || 0) + " NP";
                    document.getElementById('nav-bids').innerText = (d.bids || 0) + " BIDS";
                    document.getElementById('nav-lvl').innerText = "LVL " + level;
                    document.getElementById('nav-xp').style.width = (xpNoNivel / 10) + "%";
                    document.getElementById('xp-val').innerText = `${xpNoNivel}/1000`;

                    renderEmojiPicker(user.uid, d.mochilaEmojis || emojisIniciais);
                    if(document.getElementById('mission-panel').classList.contains('active')) renderMissions(currentMissionTab);
                }
            });

            const sendMsg = async () => {
                const input = document.getElementById('chat-in');
                const txt = input.value.trim();
                if(!txt) return;

                if(currentChatMode === 'global') {
                    await addDoc(collection(db, "global_chat"), {
                        text: txt, uid: user.uid, nome: userData.nome || "Membro",
                        avatar: userData.avatarEmoji || "👤", timestamp: serverTimestamp()
                    });
                } else {
                    const box = document.getElementById('chat-msgs');
                    const item = document.createElement('div');
                    item.className = "chat-msg-item";
                    item.style.border = "1px solid #00f2ff";
                    item.innerHTML = `<div><div class="chat-name">VOCÊ -> ${currentPrivateUser.nome}</div><div class="chat-text">${txt}</div></div>`;
                    box.appendChild(item);
                    box.scrollTop = box.scrollHeight;
                }
                input.value = "";
            };
            document.getElementById('chat-go').onclick = sendMsg;
            document.getElementById('chat-in').onkeypress = (e) => { if(e.key === 'Enter') sendMsg(); };
            
            loadGlobalChat();
        } else { window.location.href = "login.html"; }
    });

    function loadGlobalChat() {
        const q = query(collection(db, "global_chat"), orderBy("timestamp", "desc"), limit(30));
        onSnapshot(q, snap => {
            if(currentChatMode !== 'global') return;
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
                if(isLocked) return alert("Este emoji está bloqueado na sua mochila!");
                await updateDoc(doc(db, "usuarios", uid), { avatarEmoji: emo });
                picker.classList.remove('active');
            };
            picker.appendChild(item);
        });
    }
}

if (document.readyState === "complete") { initOverlay(); } 
else { window.addEventListener("load", initOverlay); }
