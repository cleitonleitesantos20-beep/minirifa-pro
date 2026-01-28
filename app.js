import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, collection, query, orderBy, limit, onSnapshot, increment } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAYO5RWaJy5y7r7jvzFk3wq-ByqM_dWWO8",
    authDomain: "minharifadigital.firebaseapp.com",
    projectId: "minharifadigital",
    storageBucket: "minharifadigital.firebasestorage.app",
    messagingSenderId: "59630725905",
    appId: "1:59630725905:web:396c8cfca385dc3d957ab0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let user = null;
let userData = null;
let selected = [];

const getToday = () => new Date().toISOString().split('T')[0];

window.login = async () => {
    try {
        await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('senha').value);
    } catch (e) { alert("Erro: " + e.message); }
};

window.cadastrar = async () => {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    if(!nome || !email || !senha) return alert("Preencha tudo!");
    
    try {
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        const code = nome.substring(0,3).toUpperCase() + Math.floor(Math.random()*1000);
        await setDoc(doc(db, "usuarios", res.user.uid), {
            nome, email, saldo: 0, meuCodigo: code, indicadoPor: document.getElementById('ref').value || "", 
            vendasTotais: 0, indicacoesSemana: 0, lastCheckin: "", lastVideo: ""
        });
        location.reload();
    } catch (e) { alert("Erro: " + e.message); }
};

window.sair = () => signOut(auth);

onAuthStateChanged(auth, (u) => {
    if (u) {
        user = u;
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        onSnapshot(doc(db, "usuarios", u.uid), (snap) => {
            userData = snap.data();
            if(!userData) return;
            document.getElementById('u-nome').innerText = userData.nome || "Usuário";
            document.getElementById('u-saldo').innerText = (userData.saldo || 0).toFixed(2);
            document.getElementById('u-code').innerText = userData.meuCodigo || "...";
            document.getElementById('u-vendas').innerText = userData.vendasTotais || 0; 
            
            // Trava visual de botões
            document.getElementById('btn-checkin').disabled = userData.lastCheckin === getToday();
            document.getElementById('btn-video').disabled = userData.lastVideo === getToday();

            renderGrids(userData.vendasTotais || 0); 
        });
        loadRank();
    } else {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('hidden');
    }
});

window.checkin = async () => {
    if(userData.lastCheckin === getToday()) return alert("Você já fez o check-in hoje!");
    await updateDoc(doc(db, "usuarios", user.uid), { 
        saldo: increment(0.05),
        lastCheckin: getToday()
    });
    alert("+ R$ 0,05!");
};

window.video = () => {
    if(userData.lastVideo === getToday()) return alert("Você já assistiu o vídeo hoje!");
    const btn = document.getElementById('btn-video');
    const timer = document.getElementById('video-timer');
    let t = 30;
    btn.classList.add('hidden');
    timer.classList.remove('hidden');
    
    const i = setInterval(async () => {
        t--;
        document.getElementById('timer').innerText = t;
        if(t <= 0) {
            clearInterval(i);
            await updateDoc(doc(db, "usuarios", user.uid), { 
                saldo: increment(0.10),
                lastVideo: getToday()
            });
            timer.classList.add('hidden');
            btn.classList.remove('hidden');
            alert("+ R$ 0,10!");
        }
    }, 1000);
};

function renderGrids(vendas) {
    const configs = [
        {id: 'grid-1', cardId: 'card-fase1', min: 1, max: 50, locked: false},
        {id: 'grid-2', cardId: 'card-fase2', min: 51, max: 100, locked: vendas < 50}, 
        {id: 'grid-3', cardId: 'card-fase3', min: 101, max: 150, locked: vendas < 100}
    ];
    configs.forEach(c => {
        const el = document.getElementById(c.id);
        const card = document.getElementById(c.cardId);
        if(!el || !card) return; 
        c.locked ? card.classList.add('fase-locked') : card.classList.remove('fase-locked');
        el.innerHTML = "";
        for(let i=c.min; i<=c.max; i++) {
            const btn = document.createElement('button');
            btn.className = `num ${selected.includes(i) ? 'selected' : ''}`;
            btn.innerText = i;
            btn.onclick = () => toggleNum(i);
            el.appendChild(btn);
        }
    });
}

function toggleNum(n) {
    if(selected.includes(n)) selected = selected.filter(x => x !== n);
    else selected.push(n);
    document.getElementById('sel-nums').innerText = selected.join(', ');
    document.getElementById('total-val').innerText = (selected.length * 7).toFixed(2);
    selected.length > 0 ? document.getElementById('checkout').classList.remove('hidden') : document.getElementById('checkout').classList.add('hidden');
    document.querySelectorAll('.num').forEach(b => {
        selected.includes(parseInt(b.innerText)) ? b.classList.add('selected') : b.classList.remove('selected');
    });
}

function loadRank() {
    const q = query(collection(db, "usuarios"), orderBy("indicacoesSemana", "desc"), limit(3));
    onSnapshot(q, (snap) => {
        let html = "";
        const icons = ["🥇","🥈","🥉"];
        const fixedPts = [15, 10, 5]; // Pontuação fixa solicitada
        
        snap.docs.forEach((d, i) => {
            html += `<p><span>${icons[i]} ${d.data().nome || "Anônimo"}</span> <b>${fixedPts[i]} pts</b></p>`;
        });
        document.getElementById('rank-list').innerHTML = html || "<p>Carregando...</p>";
    });
}

window.pix = () => alert("Acúmulo de saldo registrado.");
