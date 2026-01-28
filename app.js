import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Configuração Firebase (v5.1)
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

// --- CONFIGURAÇÃO DAS FASES SEQUENCIAIS ---
const configFases = [
    { id: 1, inicio: 1, fim: 50, preco: 110, metaIndica: 0 },
    { id: 2, inicio: 51, fim: 100, preco: 220, metaIndica: 50 },
    { id: 3, inicio: 101, fim: 150, preco: 350, metaIndica: 100 }
];

// --- PROTEÇÃO DE ROTA E DADOS EM TEMPO REAL ---
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
        // Se não estiver logado, expulsa para a página de login
        window.location.href = 'login.html';
    }
});

// --- ATUALIZAÇÃO DA INTERFACE ---
function renderDashboard() {
    const elNome = document.getElementById('u-nome');
    const elSaldo = document.getElementById('u-saldo');
    const elCode = document.getElementById('u-code');
    const elVendas = document.getElementById('u-vendas');

    if (elNome) elNome.innerText = userData.nome || "Usuário";
    if (elSaldo) elSaldo.innerText = (userData.saldo || 0).toFixed(2);
    if (elCode) elCode.innerText = userData.meuCodigo || "---";
    if (elVendas) elVendas.innerText = userData.vendas || 0;
}

// --- LÓGICA DE SELEÇÃO E VALORES (BUG 1, 3 e 4) ---
window.selectNum = (faseId, n, el) => {
    const faseInfo = configFases.find(f => f.id === faseId);
    
    // Bloqueio de segurança por indicações
    if (faseId > 1 && (userData.vendas || 0) < faseInfo.metaIndica) {
        return alert(`🔒 Bloqueado! Esta fase requer ${faseInfo.metaIndica} indicações.`);
    }

    const idNum = `N${n}`;
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
        
        // Cálculo proporcional ao valor da fase
        const valorTotal = selecionados.length * (faseInfo.preco / 50);
        document.getElementById('total-val').innerText = valorTotal.toFixed(2);
    } else {
        if (checkout) checkout.classList.add('hidden');
    }
};

// --- GERAÇÃO DOS GRIDS SEQUENCIAIS (Bug 4) ---
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

// --- CONTROLE DE TRAVAS VISUAIS ---
function atualizarTravaFases() {
    configFases.forEach(fase => {
        const card = document.getElementById(`fase-card-${fase.id}`);
        if (fase.id > 1 && card) {
            const bloqueado = (userData.vendas || 0) < fase.metaIndica;
            card.classList.toggle('locked', bloqueado);
            card.style.opacity = bloqueado ? "0.4" : "1";
        }
    });
}

// --- TAREFAS DIÁRIAS ---
window.checkin = async () => {
    const hoje = new Date().toISOString().split('T')[0];
    if (userData.lastCheckin === hoje) return alert("IA: Limite de 1 check-in por dia.");
    await updateDoc(doc(db, "usuarios", user.uid), { 
        saldo: increment(0.01), 
        lastCheckin: hoje 
    });
    alert("Check-in: +R$ 0,01");
};

window.video = () => {
    const hoje = new Date().toISOString().split('T')[0];
    if (userData.lastVideo === hoje) return alert("IA: Limite de vídeos diários atingido.");
    
    const btn = document.getElementById('btn-video');
    const timerArea = document.getElementById('video-timer');
    
    if(btn) btn.disabled = true;
    if(timerArea) timerArea.classList.remove('hidden');

    let tempo = 30;
    const interval = setInterval(async () => {
        tempo--;
        const tDisplay = document.getElementById('timer');
        if(tDisplay) tDisplay.innerText = tempo;
        
        if (tempo <= 0) {
            clearInterval(interval);
            await updateDoc(doc(db, "usuarios", user.uid), { 
                saldo: increment(0.02), 
                lastVideo: hoje 
            });
            if(timerArea) timerArea.classList.add('hidden');
            if(btn) btn.disabled = false;
            alert("Anúncio recompensado: +R$ 0,02");
        }
    }, 1000);
};

window.pix = () => {
    const total = document.getElementById('total-val').innerText;
    alert(`IA: Gerando QR Code PIX no valor de R$ ${total}...`);
};

// Dispara a criação dos grids ao carregar a página
document.addEventListener('DOMContentLoaded', inicializarGrids);
