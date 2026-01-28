import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, collection, query, where, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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

let user = null;
let userData = null;

// --- AUTH ---
window.cadastrar = async () => {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const ref = document.getElementById('ref').value;

    if (!nome || !email || !senha) return alert("Preencha os campos!");

    try {
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        const meuCodigo = Math.random().toString(36).substring(2, 7).toUpperCase();

        await setDoc(doc(db, "usuarios", res.user.uid), {
            nome, email, meuCodigo,
            saldo: 0, xp: 0, vendas: 0,
            criadoEm: new Date().toISOString()
        });

        // BÔNUS DE INDICAÇÃO REDUZIDO (R$ 0.10)
        if (ref) {
            const q = query(collection(db, "usuarios"), where("meuCodigo", "==", ref));
            const snap = await getDocs(q);
            if (!snap.empty) {
                await updateDoc(doc(db, "usuarios", snap.docs[0].id), {
                    saldo: increment(0.10),
                    vendas: increment(1)
                });
            }
        }
        location.reload();
    } catch (e) { alert("Erro ao cadastrar: " + e.message); }
};

window.login = async () => {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    try {
        await signInWithEmailAndPassword(auth, email, senha);
    } catch (e) { alert("Erro: " + e.message); }
};

window.sair = () => signOut(auth).then(() => location.reload());

onAuthStateChanged(auth, (u) => {
    if (u) {
        user = u;
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        
        onSnapshot(doc(db, "usuarios", u.uid), (snap) => {
            userData = snap.data();
            if (userData) renderApp();
        });
    }
});

function renderApp() {
    document.getElementById('u-nome').innerText = userData.nome;
    document.getElementById('u-saldo').innerText = userData.saldo.toFixed(2);
    document.getElementById('u-code').innerText = userData.meuCodigo;
    document.getElementById('u-vendas').innerText = userData.vendas;
}

// --- GANHOS REDUZIDOS (ECONOMIA DE RETENÇÃO) ---

window.checkin = async () => {
    const hoje = new Date().toISOString().split('T')[0];
    if (userData.lastCheckin === hoje) return alert("IA: Check-in já realizado hoje.");

    await updateDoc(doc(db, "usuarios", user.uid), {
        saldo: increment(0.01), // Reduzido para 0.01
        lastCheckin: hoje
    });
    alert("IA: Check-in confirmado +R$ 0,01");
};

window.video = () => {
    const hoje = new Date().toISOString().split('T')[0];
    if (userData.lastVideo === hoje) return alert("IA: Limite de vídeos diários atingido.");

    const btn = document.getElementById('btn-video');
    const timerBox = document.getElementById('video-timer');
    const timerVal = document.getElementById('timer');

    btn.disabled = true;
    timerBox.classList.remove('hidden');
    let tempo = 30;

    const contagem = setInterval(() => {
        tempo--;
        timerVal.innerText = tempo;
        if (tempo <= 0) {
            clearInterval(contagem);
            finalizarVideo(hoje);
        }
    }, 1000);
};

async function finalizarVideo(data) {
    await updateDoc(doc(db, "usuarios", user.uid), {
        saldo: increment(0.02), // Reduzido para 0.02
        lastVideo: data
    });
    document.getElementById('video-timer').classList.add('hidden');
    document.getElementById('btn-video').disabled = false;
    alert("IA: Recompensa processada +R$ 0,02");
}

// --- SISTEMA DE FASES E COMPRA (Fiel 4.1) ---

const fases = [
    { id: 1, preco: 7, total: 30, ind: 0 },
    { id: 2, preco: 7, total: 30, ind: 50 },
    { id: 3, preco: 7, total: 30, ind: 100 }
];

let selecionados = [];

window.selectNum = (fase, num, el) => {
    const id = `${fase}-${num}`;
    if (selecionados.includes(id)) {
        selecionados = selecionados.filter(i => i !== id);
        el.classList.remove('selected');
    } else {
        selecionados.push(id);
        el.classList.add('selected');
    }
    renderCheckout();
};

function renderCheckout() {
    const check = document.getElementById('checkout');
    if (selecionados.length > 0) {
        check.classList.remove('hidden');
        document.getElementById('sel-nums').innerText = selecionados.join(', ');
        document.getElementById('total-val').innerText = (selecionados.length * 7).toFixed(2);
    } else {
        check.classList.add('hidden');
    }
}

window.pix = () => {
    alert("IA: Gerando PIX de R$ " + (selecionados.length * 7).toFixed(2) + "\n\nO Robô está processando sua solicitação...");
};

// --- RENDERIZAR GRIDS ---
fases.forEach(f => {
    const grid = document.getElementById(`grid-${f.id}`);
    for (let i = 1; i <= f.total; i++) {
        const btn = document.createElement('div');
        btn.className = 'num-btn';
        btn.innerText = i;
        btn.onclick = () => selectNum(f.id, i, btn);
        grid.appendChild(btn);
    }
});
