import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAYO5RWaJy5y7r7jvzFk3wq-ByqM_dWWO8",
    authDomain: "minharifadigital.firebaseapp.com",
    projectId: "minharifadigital",
    storageBucket: "minharifadigital.firebasestorage.app",
    messagingSenderId: "59630725905",
    appId: "1:59630725905:web:396c8cfca385dc3d957ab0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let user, userData, selecionados = [];

// --- CONFIGURAÇÃO DAS FASES v5.2 ---
const configFases = [
    { id: 1, inicio: 1, fim: 50, precoTotal: 110, metaIndica: 0 },
    { id: 2, inicio: 51, fim: 100, precoTotal: 220, metaIndica: 50 },
    { id: 3, inicio: 101, fim: 150, precoTotal: 330, metaIndica: 100 }
];

// --- MONITORAMENTO DE USUÁRIO ---
onAuthStateChanged(auth, (u) => {
    if (u) {
        user = u;
        onSnapshot(doc(db, "usuarios", u.uid), (snap) => {
            userData = snap.data();
            if (userData) {
                renderDashboard();
                atualizarTravaFases();
            }
        });
    } else {
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
});

// --- RENDERIZAÇÃO v5.2 (SISTEMA DE LEVEL) ---
function renderDashboard() {
    const elementos = {
        'u-nome': userData.nome,
        'u-saldo': (userData.saldo || 0).toFixed(2),
        'u-code': userData.meuCodigo,
        'u-lvl': Math.floor((userData.xp || 0) / 100) + 1,
        'u-xp': userData.xp || 0
    };

    for (let id in elementos) {
        let el = document.getElementById(id);
        if (el) el.innerText = elementos[id];
    }
}

// --- LÓGICA DE SELEÇÃO (R$ 8,00 POR NÚMERO) ---
window.selectNum = (faseId, n, el) => {
    const fase = configFases.find(f => f.id === faseId);
    const meta = fase.metaIndica;
    
    // Verifica se a fase está bloqueada (vermelha)
    if ((userData.vendas || 0) < meta) {
        alert(`Fase bloqueada! Você precisa de ${meta} indicações.`);
        return;
    }

    const idNum = `F${faseId}N${n}`;
    if (selecionados.includes(idNum)) {
        selecionados = selecionados.filter(x => x !== idNum);
        el.classList.remove('selected');
    } else {
        selecionados.push(idNum);
        el.classList.add('selected');
    }
    
    const checkout = document.getElementById('checkout');
    if (selecionados.length > 0) {
        checkout.classList.remove('hidden');
        document.getElementById('sel-nums').innerText = selecionados.length;
        // Cálculo v5.2: R$ 8,00 por número
        document.getElementById('total-val').innerText = (selecionados.length * 8).toFixed(2);
    } else {
        checkout.classList.add('hidden');
    }
};

// --- CONTROLE VISUAL DAS FASES (VERMELHO SE BLOQUEADO) ---
function atualizarTravaFases() {
    configFases.forEach(fase => {
        const card = document.getElementById(`fase-card-${fase.id}`);
        if (card && fase.id > 1) {
            const bloqueado = (userData.vendas || 0) < fase.metaIndica;
            // Se bloqueado, adiciona classe 'locked' (que definimos como vermelha no CSS)
            if (bloqueado) {
                card.classList.add('locked');
            } else {
                card.classList.remove('locked');
            }
        }
    });
}

// --- TAREFAS DIÁRIAS v5.2 ---
window.checkin = async () => {
    const hoje = new Date().toISOString().split('T')[0];
    if (userData.lastCheckin === hoje) return alert("Você já fez o check-in hoje!");
    
    await updateDoc(doc(db, "usuarios", user.uid), {
        saldo: increment(0.01),
        xp: increment(5),
        lastCheckin: hoje
    });
    alert("Check-in realizado! +R$ 0,01 e +5 XP");
};

window.video = () => {
    const hoje = new Date().toISOString().split('T')[0];
    if (userData.lastVideo === hoje) return alert("Você já assistiu ao vídeo de hoje!");

    const btn = document.getElementById('btn-video');
    const timerBox = document.getElementById('video-timer');
    const timerSec = document.getElementById('timer');

    btn.disabled = true;
    timerBox.classList.remove('hidden');

    let timeLeft = 30;
    const contagem = setInterval(async () => {
        timeLeft--;
        timerSec.innerText = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(contagem);
            await updateDoc(doc(db, "usuarios", user.uid), {
                saldo: increment(0.02),
                xp: increment(10),
                lastVideo: hoje
            });
            timerBox.classList.add('hidden');
            btn.disabled = false;
            alert("Propaganda concluída! +R$ 0,02 e +10 XP");
        }
    }, 1000);
};

// --- INICIALIZAÇÃO DOS GRIDS ---
function inicializarGrids() {
    configFases.forEach(fase => {
        const grid = document.getElementById(`grid-${fase.id}`);
        if (grid) {
            grid.innerHTML = "";
            for (let i = fase.inicio; i <= fase.fim; i++) {
                const b = document.createElement('div');
                b.className = 'num-btn';
                b.innerText = i;
                b.onclick = () => window.selectNum(fase.id, i, b);
                grid.appendChild(b);
            }
        }
    });
}

window.pix = () => alert("Redirecionando para o Checkout PIX Seguros...");

document.addEventListener('DOMContentLoaded', inicializarGrids);
