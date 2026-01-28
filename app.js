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
let selected = [];

// === AUTH ===
window.login = async () => {
    try {
        await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('senha').value);
    } catch (e) { alert("Erro no login: " + e.code); }
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
            nome, email, saldo: 0, meuCodigo: code, indicadoPor: document.getElementById('ref').value, vendasTotais: 0, indicacoesSemana: 0
        });
        location.reload();
    } catch (e) { alert("Erro: " + e.message); }
};

window.sair = () => signOut(auth);

// === APP LOGIC ===
onAuthStateChanged(auth, (u) => {
    if (u) {
        user = u;
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        
        onSnapshot(doc(db, "usuarios", u.uid), (snap) => {
            const d = snap.data();
            if(!d) return;
            document.getElementById('u-nome').innerText = d.nome;
            document.getElementById('u-saldo').innerText = d.saldo.toFixed(2);
            document.getElementById('u-code').innerText = d.meuCodigo;
            document.getElementById('u-vendas').innerText = d.vendasTotais;
            renderGrids(d.vendasTotais);
        });
        loadRank();
    } else {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('hidden');
    }
});

// === EARN ===
window.checkin = async () => {
    await updateDoc(doc(db, "usuarios", user.uid), { saldo: increment(0.05) });
    alert("+ R$ 0,05!");
};

window.video = () => {
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
            await updateDoc(doc(db, "usuarios", user.uid), { saldo: increment(0.10) });
            timer.classList.add('hidden');
            btn.classList.remove('hidden');
            alert("+ R$ 0,10!");
        }
    }, 1000);
};

// === GAME ===
function renderGrids(vendas) {
    const configs = [
        {id: 'grid-1', min: 1, max: 50, lock: false},
        {id: 'grid-2', min: 51, max: 100, lock: vendas < 50, ui: 'fase-2'},
        {id: 'grid-3', min: 101, max: 150, lock: vendas < 100, ui: 'fase-3'}
    ];

    configs.forEach(c => {
        const el = document.getElementById(c.id);
        el.innerHTML = "";
        
        // Controle do Cadeado
        if(c.ui) {
            const ui = document.getElementById(c.ui);
            if(c.lock) ui.querySelector('.lock').style.display = 'flex';
            else ui.querySelector('.lock').style.display = 'none';
        }

        for(let i=c.min; i<=c.max; i++) {
            const btn = document.createElement('button');
            btn.className = `num ${selected.includes(i) ? 'selected' : ''}`;
            btn.innerText = i;
            if(c.lock) btn.disabled = true;
            btn.onclick = () => toggleNum(i);
            el.appendChild(btn);
        }
    });
}

function toggleNum(n) {
    if(selected.includes(n)) selected = selected.filter(x => x !== n);
    else selected.push(n);
    
    const total = selected.length * 7;
    document.getElementById('sel-nums').innerText = selected.join(', ');
    document.getElementById('total-val').innerText = total.toFixed(2);
    
    if(selected.length > 0) document.getElementById('checkout').classList.remove('hidden');
    else document.getElementById('checkout').classList.add('hidden');
    
    // Re-render para manter estilo visual sem recarregar tudo
    document.querySelectorAll('.num').forEach(b => {
        if(selected.includes(parseInt(b.innerText))) b.classList.add('selected');
        else b.classList.remove('selected');
    });
}

// === RANKING & PIX ===
function loadRank() {
    onSnapshot(query(collection(db, "usuarios"), orderBy("indicacoesSemana", "desc"), limit(3)), (snap) => {
        let html = "";
        const icons = ["🥇","🥈","🥉"];
        snap.docs.forEach((d, i) => {
            html += `<p><span>${icons[i]} ${d.data().nome}</span> <b>${d.data().indicacoesSemana} pts</b></p>`;
        });
        document.getElementById('rank-list').innerHTML = html;
    });
}

window.pix = () => alert(`Gerando PIX de R$ ${(selected.length * 7).toFixed(2)}...`);
