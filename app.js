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
let user, userData;

window.cadastrar = async () => {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const ref = document.getElementById('ref').value;
    if (!nome || !email || !senha) return alert("Preencha os campos!");
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
    } catch (e) { alert(e.message); }
};

window.login = async () => {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    try { await signInWithEmailAndPassword(auth, email, senha); } catch (e) { alert("Erro: " + e.message); }
};

onAuthStateChanged(auth, (u) => {
    if (u) {
        user = u;
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        onSnapshot(doc(db, "usuarios", u.uid), (snap) => {
            userData = snap.data();
            if (userData) render();
        });
    }
});

function render() {
    document.getElementById('u-nome').innerText = userData.nome;
    document.getElementById('u-saldo').innerText = userData.saldo.toFixed(2);
    document.getElementById('u-code').innerText = userData.meuCodigo;
    document.getElementById('u-vendas').innerText = userData.vendas;
}

window.checkin = async () => {
    const hoje = new Date().toISOString().split('T')[0];
    if (userData.lastCheckin === hoje) return alert("IA: Check-in já realizado hoje.");
    await updateDoc(doc(db, "usuarios", user.uid), { saldo: increment(0.01), lastCheckin: hoje });
    alert("Check-in: +R$ 0,01");
};

window.video = () => {
    const hoje = new Date().toISOString().split('T')[0];
    if (userData.lastVideo === hoje) return alert("IA: Limite diário atingido.");
    document.getElementById('btn-video').disabled = true;
    document.getElementById('video-timer').classList.remove('hidden');
    let tempo = 30;
    const interval = setInterval(() => {
        tempo--; document.getElementById('timer').innerText = tempo;
        if (tempo <= 0) { clearInterval(interval); finalizarVideo(hoje); }
    }, 1000);
};

async function finalizarVideo(hoje) {
    await updateDoc(doc(db, "usuarios", user.uid), { saldo: increment(0.02), lastVideo: hoje });
    document.getElementById('video-timer').classList.add('hidden');
    document.getElementById('btn-video').disabled = false;
    alert("Vídeo: +R$ 0,02");
}

// Inicializa grids
[1, 2].forEach(f => {
    const grid = document.getElementById(`grid-${f}`);
    if(grid) for(let i=1; i<=30; i++) {
        const b = document.createElement('div'); b.className = 'num-btn'; b.innerText = i;
        grid.appendChild(b);
    }
});
