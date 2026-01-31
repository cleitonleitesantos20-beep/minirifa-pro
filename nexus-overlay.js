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
    const savedTheme = localStorage.getItem('nexusTheme');
    if (savedTheme === 'light') { document.body.classList.add('light-mode'); }

    const style = document.createElement('style');
    style.textContent = `
        * { box-sizing: border-box; }
        body { margin: 0; padding-top: 75px; transition: background 0.3s; background: #050505; color: #fff; font-family: 'Rajdhani', sans-serif; }
        body.light-mode { background: #f5f5f5 !important; color: #111 !important; }
        body.light-mode .nexus-header { background: #fff !important; color: #000 !important; border-bottom: 1px solid #ccc; }
        
        .nexus-header {
            position: fixed; top: 0; left: 0; width: 100%; height: 75px;
            background: #050505; border-bottom: 1px solid #1a1a1a;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 10px; z-index: 10000;
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

        .emoji-picker {
            position: absolute; top: 80px; left: 10px; background: #0a0a0a; border: 1px solid #333;
            border-radius: 12px; padding: 12px; display: none; grid-template-columns: repeat(5, 1fr);
            gap: 8px; z-index: 10001; box-shadow: 0 10px 30px rgba(0,0,0,0.9); width: 230px;
        }
        .emoji-picker.active { display: grid; }
        .emoji-item { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: #151515; border-radius: 8px; cursor: pointer; font-size: 1.2rem; transition: 0.2s; border: 1px solid transparent; }
        .emoji-item:hover:not(.locked) { border-color: #00f2ff; }
        .emoji-item.locked { opacity: 0.3; cursor: not-allowed; filter: grayscale(1); }

        .ctrl-group { display: flex; align-items: center; gap: 10px; }
        .btn-recarga { background: linear-gradient(135deg, #00ff88, #009955); color: #000; border: none; padding: 5px 10px; border-radius: 5px; font-family: 'Orbitron'; font-size: 0.55rem; font-weight: 900; cursor: pointer; }
        .mode-toggle { width: 32px; height: 16px; background: #333; border-radius: 10px; position: relative; cursor: pointer; border: 1px solid #444; }
        .mode-toggle::after { content: '🌙'; position: absolute; left: 2px; top: 1px; font-size: 8px; transition: 0.3s; }
        body.light-mode .mode-toggle::after { content: '☀️'; left: 18px; }

        .nexus-mission-fab { position: fixed; bottom: 15px; left: 15px; width: 45px; height: 45px; background: #00f2ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; z-index: 9999; cursor: pointer; box-shadow: 0 0 10px #00f2ff; color: #000; }

        .mission-panel { position: fixed; bottom: 70px; left: 15px; width: 280px; height: 400px; background: #0a0a0ae6; backdrop-filter: blur(10px); border: 1px solid #00f2ff66; border-radius: 12px; display: none; flex-direction: column; z-index: 10000; color: #fff; }
        .mission-panel.active { display: flex; }
        .chat-tabs { display: flex; background: rgba(0,0,0,0.5); border-bottom: 1px solid #333; }
        .chat-tab { flex: 1; padding: 8px; text-align: center; font-family: 'Orbitron'; font-size: 0.55rem; cursor: pointer; color: #666; }
        .chat-tab.active-tab { color: #fff; border-bottom: 2px solid #00f2ff; }
        
        .nexus-week-row { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #333; }
        .week-day { width: 25px; height: 25px; border-radius: 50%; border: 1px solid #444; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; color: #666; }
        .week-day.today { border-color: #00f2ff; color: #fff; }
        .week-day.checked { background: #00ff88; color: #000; }

        .mission-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #222; font-size: 0.8rem; }
        .mission-check { font-size: 0.65rem; color: #00ff88; border: 1px solid #00ff88; padding: 3px 8px; border-radius: 4px; cursor: pointer; }
        .mission-check.done { border: none; font-size: 1rem; }
        .mission-check.disabled { border-color: #444; color: #444; cursor: not-allowed; }
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
                    </div>
                </div>
            </div>
            <div class="ctrl-group">
                <button class="btn-recarga" onclick="window.location.href='deposito.html'">RECARGA</button>
                <div class="mode-toggle" id="theme-btn"></div>
            </div>
        </div>
        
        <div class="nexus-mission-fab" id="mission-fab">🎯</div>

        <div class="mission-panel" id="mission-panel">
            <div style="background:#00f2ff; color:#000; padding:8px; font-family:Orbitron; font-size:0.55rem; display:flex; justify-content:space-between; align-items:center;">
                <span>CENTRAL DE MISSÕES</span>
                <span style="cursor:pointer; font-size:1.2rem;" onclick="document.getElementById('mission-panel').classList.remove('active')">×</span>
            </div>
            <div class="chat-tabs">
                <div class="chat-tab active-tab" id="mtab-daily" onclick="switchMissionTab('daily')">DIÁRIAS</div>
                <div class="chat-tab" id="mtab-monthly" onclick="switchMissionTab('monthly')">MENSAIS</div>
            </div>
            <div class="nexus-week-row" id="week-row"></div>
            <div id="mission-content" style="flex:1; overflow-y:auto;"></div>
        </div>
    `;
    document.body.prepend(ui);

    let userData = {};
    let currentLvl = 0;
    let currentMissionTab = 'daily';
    const emojisDisponiveis = ["👤", "🔥", "🐱", "🐶", "🦊", "💎", "⚡", "👑", "🚀", "🎮"];
    const emojisIniciais = ["👤", "🔥", "🐱", "🐶", "🦊"];

    document.getElementById('theme-btn').onclick = () => {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('nexusTheme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    };

    document.getElementById('mission-fab').onclick = () => {
        const p = document.getElementById('mission-panel');
        p.classList.toggle('active');
        if(p.classList.contains('active')) renderMissions(currentMissionTab);
    };

    const navAv = document.getElementById('nav-av');
    const picker = document.getElementById('emoji-picker');
    navAv.onclick = (e) => { e.stopPropagation(); picker.classList.toggle('active'); };
    document.addEventListener('click', () => picker.classList.remove('active'));

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
        
        if(type === 'daily') {
            ['D','S','T','Q','Q','S','S'].forEach((d, i) => {
                const el = document.createElement('div');
                el.className = `week-day ${i === now.getDay() ? 'today' : ''} ${i === now.getDay() && completedDaily.length > 0 ? 'checked' : ''}`;
                el.innerText = d;
                weekRow.appendChild(el);
            });
        }

        let missions = type === 'daily' ? [
            { txt: "Check-in Manhã (07h-18h)", id: 'chk_day', active: (hour >= 7 && hour < 19), isCheckin: true },
            { txt: "Check-in Noite (19h-06h)", id: 'chk_night', active: (hour >= 19 || hour < 7), isCheckin: true },
            { txt: "Visitar 3 Lojas", id: 'm_visit', xp: 5 }
        ] : [
            { txt: "Participar de 5 Drops", id: 'mm_drop', xp: 50 },
            { txt: "Campanha Nexus", id: 'mm_camp', xp: 100 }
        ];

        const completedList = type === 'daily' ? completedDaily : completedMonthly;

        missions.forEach((m) => {
            const isDone = completedList.includes(m.id);
            const div = document.createElement('div');
            div.className = "mission-item";
            
            let btnHtml = isDone ? `<span class="mission-check done">✅</span>` : 
                          (m.isCheckin && !m.active) ? `<span class="mission-check disabled">FORA HORA</span>` :
                          `<span class="mission-check" onclick="claimMission('${m.id}', '${type}', ${m.xp || 2})">RESGATAR</span>`;

            div.innerHTML = `<span>${m.txt}</span>${btnHtml}`;
            content.appendChild(div);
        });
    };

    window.claimMission = async (id, type, xpVal) => {
        try {
            const field = type === 'daily' ? 'daily_missions' : 'monthly_missions';
            await updateDoc(doc(db, "usuarios", auth.currentUser.uid), { 
                xp: increment(xpVal),
                [field]: arrayUnion(id)
            });
        } catch (e) { console.error(e); }
    };

    onAuthStateChanged(auth, user => {
        if (user) {
            onSnapshot(doc(db, "usuarios", user.uid), async snap => {
                if(snap.exists()){
                    const d = snap.data();
                    userData = d;
                    
                    const now = new Date();
                    const todayStr = now.toLocaleDateString('pt-BR');
                    if (d.last_daily_reset !== todayStr) {
                        await updateDoc(doc(db, "usuarios", user.uid), { last_daily_reset: todayStr, daily_missions: [] });
                        return;
                    }

                    const xpTotal = d.xp || 0;
                    const level = Math.floor(xpTotal / 1000) + 1;
                    const xpNoNivel = xpTotal % 1000;

                    if(currentLvl !== 0 && level > currentLvl) {
                        await updateDoc(doc(db, "usuarios", user.uid), { saldo: increment(10) });
                        alert(`LEVEL UP! Nível ${level} (+10 NP)`);
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
                if(isLocked) return;
                await updateDoc(doc(db, "usuarios", uid), { avatarEmoji: emo });
                picker.classList.remove('active');
            };
            picker.appendChild(item);
        });
    }
}

if (document.readyState === "complete") { initOverlay(); } 
else { window.addEventListener("load", initOverlay); }
