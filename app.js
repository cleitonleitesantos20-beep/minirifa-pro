import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
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

// --- SISTEMA DE LOGIN E CADASTRO (CORRIGIDO) ---
window.handleLogin = async () => {
    const e = document.getElementById('l-email').value;
    const s = document.getElementById('l-senha').value;
    if(!e || !s) return alert("Preencha e-mail e senha!");
    try {
        await signInWithEmailAndPassword(auth, e, s);
    } catch (err) { alert("Erro ao entrar: Verifique seus dados."); }
};

window.handleCadastrar = async () => {
    const n = document.getElementById('c-nome').value;
    const e = document.getElementById('c-email').value;
    const s = document.getElementById('c-senha').value;
    const r = document.getElementById('c-ref').value;

    if(!n || !e || !s) return alert("Preencha nome, e-mail e senha!");

    try {
        const res = await createUserWithEmailAndPassword(auth, e, s);
        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        
        await setDoc(doc(db, "usuarios", res.user.uid), {
            nome: n, email: e, meuCodigo: code, saldo: 0, vendas: 0, xp: 0, data: new Date().toISOString()
        });
        
        if (r) {
            const q = query(collection(db, "usuarios"), where("meuCodigo", "==", r));
            const snap = await getDocs(q);
            if (!snap.empty) {
                await updateDoc(doc(db, "usuarios", snap.docs[0].id), { saldo: increment(0.10), vendas: increment(1) });
            }
        }
    } catch (err) { alert("Erro no cadastro: " + err.message); }
};

// --- MONITORAMENTO DE USUÁRIO ---
onAuthStateChanged(auth, (u) => {
    if (u) {
        user = u;
        // Se estiver na login.html e logar, vai para o index
        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'index.html';
        }
        
        onSnapshot(doc(db, "usuarios", u.uid), (snap) => {
            userData = snap.data();
            if (userData) {
                renderDashboard();
                atualizarTravaFases();
            }
        });
    } else {
        // Se não estiver logado e não estiver na login.html, expulsa
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
});

function renderDashboard() {
    const comps = { 'u-nome': userData.nome, 'u-saldo': (userData.saldo || 0).toFixed(2), 'u-code': userData.meuCodigo, 'u-vendas': userData.vendas || 0 };
    for (let id in comps) {
        let el = document.getElementById(id);
        if (el) el.innerText = comps[id];
    }
}

// --- LÓGICA DE SELEÇÃO E RIFAS ---
window.selectNum = (faseId, n, el) => {
    const fase = configFases.find(f => f.id === faseId);
    if (faseId > 1 && (userData.vendas || 0) < fase.metaIndica) return;

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
        if(checkout) checkout.classList.remove('hidden');
        document.getElementById('sel-nums').innerText = selecionados.length;
        document.getElementById('total-val').innerText = (selecionados.length * (fase.preco / 50)).toFixed(2);
    } else {
        if(checkout) checkout.classList.add('hidden');
    }
};

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

function atualizarTravaFases() {
    configFases.forEach(fase => {
        const card = document.getElementById(`fase-card-${fase.id}`);
        if (fase.id > 1 && card) {
            const bloqueado = (userData.vendas || 0) < fase.metaIndica;
            card.classList.toggle('locked', bloqueado);
            card.style.opacity = bloqueado ? "0.4" : "1";
            // Mostra ou esconde a mensagem de lock
            const msg = card.querySelector('.lock-msg');
            if(msg) msg.style.display = bloqueado ? 'flex' : 'none';
        }
    });
}

// --- TAREFAS ---
window.checkin = async () => {
    const hoje = new Date().toISOString().split('T')[0];
    if (userData.lastCheckin === hoje) return alert("Check-in já realizado!");
    await updateDoc(doc(db, "usuarios", user.uid), { saldo: increment(0.01), lastCheckin: hoje });
    alert("Check-in: +R$ 0,01");
};

window.video = () => {
    const hoje = new Date().toISOString().split('T')[0];
    if (userData.lastVideo === hoje) return alert("Limite de vídeos atingido!");
    
    document.getElementById('btn-video').disabled = true;
    document.getElementById('video-timer').classList.remove('hidden');

    let tempo = 30;
    const interval = setInterval(async () => {
        tempo--;
        document.getElementById('timer').innerText = tempo;
        if (tempo <= 0) {
            clearInterval(interval);
            await updateDoc(doc(db, "usuarios", user.uid), { saldo: increment(0.02), lastVideo: hoje });
            document.getElementById('video-timer').classList.add('hidden');
            document.getElementById('btn-video').disabled = false;
            alert("Vídeo recompensado!");
        }
    }, 1000);
};

window.pix = () => alert("IA: Gerando PIX de R$ " + document.getElementById('total-val').innerText);

document.addEventListener('DOMContentLoaded', inicializarGrids);
