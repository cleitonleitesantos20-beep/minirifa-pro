import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

let selecionados = [];

// Gerenciamento de Telas
window.mostrarTela = function(tela) {
    document.getElementById('tela-cadastro').style.display = tela === 'cadastro' ? 'block' : 'none';
    document.getElementById('tela-login').style.display = tela === 'login' ? 'block' : 'none';
};

// Cadastro de Perfil Permanente
window.registrarUsuario = async function() {
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-senha').value;
    const nome = document.getElementById('reg-nome').value;
    const tel = document.getElementById('reg-tel').value;

    if (!email || !senha || !nome) return alert("Preencha os campos obrigatórios!");

    try {
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        await setDoc(doc(db, "usuarios", res.user.uid), { nome, email, telefone: tel });
        alert("Perfil Pro Salvo com Sucesso!");
    } catch (e) { alert("Erro ao criar conta: " + e.message); }
};

// Sistema de Login
window.fazerLogin = async function() {
    const email = document.getElementById('log-email').value;
    const senha = document.getElementById('log-senha').value;
    try { await signInWithEmailAndPassword(auth, email, senha); } 
    catch (e) { alert("Login Inválido!"); }
};

// Monitor de Sessão (Mantém logado)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        if (snap.exists()) {
            document.getElementById('user-display').innerText = snap.data().nome;
            document.getElementById('tela-cadastro').style.display = 'none';
            document.getElementById('tela-login').style.display = 'none';
            document.getElementById('tela-rifa').style.display = 'block';
            document.getElementById('btnSair').style.display = 'block';
            iniciarRifa();
        }
    }
});

document.getElementById('btnSair').onclick = () => signOut(auth).then(() => location.reload());

function iniciarRifa() {
    const grid = document.getElementById('gridRifa');
    grid.innerHTML = ''; 
    for (let i = 1; i <= 100; i++) {
        const div = document.createElement('div');
        div.className = 'num';
        div.id = `n-${i}`;
        div.innerText = i;
        div.onclick = () => clicarNumero(i, div);
        grid.appendChild(div);
    }
    // Monitoramento 24h de vendas
    onSnapshot(doc(db, "rifas", "sorteio1"), (s) => {
        const d = s.data();
        if (d) Object.keys(d).forEach(k => {
            const el = document.getElementById(`n-${k.replace('num','')}`);
            if (d[k] === "vendido" && el) { 
                el.className = 'num sold'; 
                el.onclick = null; 
            }
        });
    });
}

function clicarNumero(n, el) {
    if (el.classList.contains('sold')) return;
    if (selecionados.includes(n)) {
        selecionados = selecionados.filter(i => i !== n);
        el.classList.remove('selected');
    } else {
        selecionados.push(n);
        el.classList.add('selected');
    }
    let total = selecionados.length * 5;
    if (selecionados.length > 5) total *= 0.9; // Desconto estratégico
    document.getElementById('qtd').innerText = selecionados.length;
    document.getElementById('total').innerText = "R$ " + total.toFixed(2);
}

document.getElementById('btnPagar').onclick = async () => {
    const user = auth.currentUser;
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    const dados = { ...snap.data(), numeros: selecionados, total: document.getElementById('total').innerText };
    
    try {
        const res = await fetch('http://192.168.1.134:3000/gerar-pix', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dados)
        });
        const d = await res.json();
        prompt("PIX COPIA E COLA:", d.copy_paste);
    } catch (e) { alert("Servidor Offline!"); }
};