import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, collection, query, orderBy, limit, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. CONFIGURAÇÃO DO SEU FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAYO5RWaJy5y7r7jvzFk3wq-ByqM_dWWO8",
  authDomain: "minharifadigital.firebaseapp.com",
  projectId: "minharifadigital",
  storageBucket: "minharifadigital.firebasestorage.app",
  messagingSenderId: "59630725905",
  appId: "1:59630725905:web:396c8cfca385dc3d957ab0",
  measurementId: "G-195QMHMXML"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let selecionados = [];
const PRECO_UNITARIO = 10.00;

// --- 2. FUNÇÕES DE ACESSO (LOGIN/CADASTRO) ---

window.cadastrar = async () => {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const ref = document.getElementById('ref-code').value;

    try {
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        const meuCod = nome.substring(0,3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
        
        await setDoc(doc(db, "usuarios", res.user.uid), {
            nome: nome,
            email: email,
            meuCodigo: meuCod,
            indicacoesSemana: 0,
            saldoPontos: 0,
            ultimoCheckin: ""
        });
        alert("Conta robótica criada!");
    } catch (e) { alert("Erro: " + e.message); }
};

window.login = async () => {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    try { await signInWithEmailAndPassword(auth, email, senha); } 
    catch (e) { alert("Erro ao entrar: " + e.message); }
};

// --- 3. LOGICA DO USUÁRIO E CHECK-IN PROGRESSIVO ---

onAuthStateChanged(auth, (user) => {
    if (user) {
        onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
            if (snap.exists()) {
                const d = snap.data();
                document.getElementById('user-display').innerText = d.nome;
                document.getElementById('meu-codigo-txt').innerText = d.meuCodigo;
                document.getElementById('ponto-semana').innerText = d.indicacoesSemana || 0;
                document.getElementById('saldo-pontos').innerText = (d.saldoPontos || 0).toFixed(2);
                
                document.getElementById('auth-section').classList.add('hidden');
                document.getElementById('tela-rifa').classList.remove('hidden');
            }
        });
    }
});

window.fazerCheckin = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const uRef = doc(db, "usuarios", user.uid);
    const uSnap = await getDoc(uRef);
    const hoje = new Date().toLocaleDateString();

    if (uSnap.data().ultimoCheckin === hoje) {
        alert("🤖 Sistema: Check-in já realizado hoje!");
    } else {
        await updateDoc(uRef, { 
            ultimoCheckin: hoje, 
            saldoPontos: increment(0.10) 
        });
        alert("📍 +R$ 0,10 adicionados ao seu saldo progressivo!");
    }
};

// --- 4. GRID DE NÚMEROS E CORES (VERDE/VERMELHO) ---

onSnapshot(doc(db, "config", "sorteio"), (snap) => {
    if (snap.exists()) {
        const d = snap.data();
        const comprados = d.numerosComprados || []; // Array de números já pagos
        renderizarGrid(comprados);
    }
});

function renderizarGrid(comprados) {
    const grid = document.getElementById('grid-principal');
    grid.innerHTML = "";
    for (let i = 1; i <= 100; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        // Se já foi comprado, fica vermelho
        btn.className = comprados.includes(i) ? 'num comprado' : 'num';
        
        btn.onclick = () => {
            if (!btn.classList.contains('comprado')) {
                selecionar(i, btn);
            }
        };
        grid.appendChild(btn);
    }
}

function selecionar(n, btn) {
    const idx = selecionados.indexOf(n);
    if (idx > -1) {
        selecionados.splice(idx, 1);
        btn.classList.remove('selecionado'); // Tira o Verde
    } else {
        selecionados.push(n);
        btn.classList.add('selecionado'); // Fica Verde
    }
    
    const payArea = document.getElementById('payment-area');
    if (selecionados.length > 0) {
        payArea.classList.remove('hidden');
        document.getElementById('num-selecionados').innerText = selecionados.join(', ');
        document.getElementById('total-pagar').innerText = (selecionados.length * PRECO_UNITARIO).toLocaleString('pt-br', {minimumFractionDigits: 2});
    } else {
        payArea.classList.add('hidden');
    }
}

// --- 5. RANKING E SORTEIO (RODAPÉ) ---

const qRanking = query(collection(db, "usuarios"), orderBy("indicacoesSemana", "desc"), limit(3));
onSnapshot(qRanking, (snap) => {
    let html = "";
    let cont = 1;
    snap.forEach(u => {
        html += `<p><b>${cont}º</b> ${u.data().nome} — ${u.data().indicacoesSemana || 0} pts</p>`;
        cont++;
    });
    document.getElementById('ranking-lista').innerHTML = html;
});
