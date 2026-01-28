import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, collection, query, where, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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

// --- CONFIGURAÇÃO DAS FASES (1-150) ---
const configFases = [
    { id: 1, inicio: 1, fim: 50, preco: 110, metaIndica: 0 },
    { id: 2, inicio: 51, fim: 100, preco: 220, metaIndica: 50 },
    { id: 3, inicio: 101, fim: 150, preco: 350, metaIndica: 100 }
];

// --- AUTENTICAÇÃO ---
window.cadastrar = async () => {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const ref = document.getElementById('ref').value;
    if (!nome || !email || !senha) return alert("Preencha todos os campos!");
    try {
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        const meuCodigo = Math.random().toString(36).substring(2, 7).toUpperCase();
        await setDoc(doc(db, "usuarios", res.user.uid), { nome, email, meuCodigo, saldo: 0, xp: 0, vendas: 0 });
        if (ref) {
            const q = query(collection(db, "usuarios"), where("meuCodigo", "==", ref));
            const snap = await getDocs(q);
            if (!snap.empty) { await updateDoc(doc(db, "usuarios", snap.docs[0].id), { saldo: increment(0.10), vendas: increment(1) }); }
        }
        location.reload();
    } catch (e) { alert("Erro: " + e.message); }
};

window.login = async () => {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    try { await signInWithEmailAndPassword(auth, email, senha); } catch (e) { alert("Acesso negado: " + e.message); }
};

onAuthStateChanged(auth, (u) => {
    if (u) {
        user = u;
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        onSnapshot(doc(db, "usuarios", u.uid), (snap) => {
            userData = snap.data();
            if (userData) renderDashboard();
        });
    } else {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('hidden');
    }
});

function renderDashboard() {
    document.getElementById('u-nome').innerText = userData.nome || "Usuário";
    document.getElementById('u-saldo').innerText = (userData.saldo || 0).toFixed(2);
    document.getElementById('u-code').innerText = userData.meuCodigo || "---";
    document.getElementById('u-vendas').innerText = userData.vendas || 0;
    atualizarTravaFases();
}

// --- SISTEMA DE RIFAS E SELEÇÃO ---
function atualizarTravaFases() {
    configFases.forEach(fase => {
        const card = document.getElementById(`fase-card-${fase.id}`);
        if (fase.id > 1 && card) {
            // Regra: Bloqueia se não atingiu a meta de indicações (pode ser trocado por meta de vendas da fase anterior)
            if (userData.vendas < fase.metaIndica) {
                card.classList.add('locked');
                card.style.opacity = "0.4";
            } else {
                card.classList.remove('locked');
                card.style.opacity = "1";
            }
        }
    });
}

window.selectNum = (faseId, n, el) => {
    const faseInfo = configFases.find(f => f.id === faseId);
    
    // Bloqueio de clique se a fase estiver trancada
    if (faseId > 1 && userData.vendas < faseInfo.metaIndica) {
        return alert(`🔒 Fase Bloqueada! Necessário ${faseInfo.metaIndica} indicações.`);
    }

    const id = `N${n}`;
    if (selecionados.includes(id)) {
        selecionados = selecionados.filter(x => x !== id);
        el.classList.remove('selected');
    } else {
        selecionados.push(id);
        el.classList.add('selected');
    }
    
    const checkout = document.getElementById('checkout');
    if (selecionados.length > 0) {
        checkout.classList.remove('hidden');
        document.getElementById('sel-nums').innerText = selecionados.join(", ");
        // Cálculo: Preço da fase dividido por 50 números * quantidade selecionada
        const precoUnitario = faseInfo.preco / 50;
        document.getElementById('total-val').innerText = (selecionados.length * precoUnitario).toFixed(2);
    } else {
        checkout.classList.add('hidden');
    }
};

// --- GERAÇÃO DOS GRIDS (1-50, 51-100, 101-150) ---
document.addEventListener('DOMContentLoaded', () => {
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
});

// --- GANHOS DIÁRIOS ---
window.checkin = async () => {
    const hoje = new Date().toISOString().split('T')[0];
    if (userData.lastCheckin === hoje) return alert("IA: Check-in já realizado!");
    await updateDoc(doc(db, "usuarios", user.uid), { saldo: increment(0.01), lastCheckin: hoje });
    alert("Check-in: +R$ 0,01");
};

window.video = () => {
    const hoje = new Date().toISOString().split('T')[0];
    if (userData.lastVideo === hoje) return alert("IA: Limite diário de vídeos atingido.");
    document.getElementById('btn-video').disabled = true;
    document.getElementById('video-timer').classList.remove('hidden');
    let tempo = 30;
    const interval = setInterval(() => {
        tempo--; 
        document.getElementById('timer').innerText = tempo;
        if (tempo <= 0) { 
            clearInterval(interval); 
            finalizarVideo(hoje); 
        }
    }, 1000);
};

async function finalizarVideo(hoje) {
    await updateDoc(doc(db, "usuarios", user.uid), { saldo: increment(0.02), lastVideo: hoje });
    document.getElementById('video-timer').classList.add('hidden');
    document.getElementById('btn-video').disabled = false;
    alert("Vídeo Concluído: +R$ 0,02");
}

window.pix = () => alert("Redirecionando para o Checkout PIX de R$ " + document.getElementById('total-val').innerText);
