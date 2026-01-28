import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
let selecionados = [];

// --- GERENCIAMENTO DE TELAS ---
window.mostrarTela = (tela) => {
    document.getElementById('tela-cadastro').style.display = tela === 'cadastro' ? 'block' : 'none';
    document.getElementById('tela-login').style.display = tela === 'login' ? 'block' : 'none';
};

// --- CADASTRO DE USUÁRIO ---
window.registrarUsuario = async function() {
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-senha').value;
    const nome = document.getElementById('reg-nome').value;
    const tel = document.getElementById('reg-tel').value;

    if (!email || !senha || !nome) return alert("Preencha os campos obrigatórios!");

    try {
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        await setDoc(doc(db, "usuarios", res.user.uid), { nome, email, telefone: tel });
        alert("Perfil Salvo com Sucesso!");
    } catch (e) { alert("Erro ao criar conta: " + e.message); }
};

// --- SISTEMA DE LOGIN ---
window.fazerLogin = async function() {
    const email = document.getElementById('log-email').value;
    const senha = document.getElementById('log-senha').value;
    try { 
        await signInWithEmailAndPassword(auth, email, senha); 
    } catch (e) { 
        alert("Login Inválido!"); 
    }
};

// --- MONITOR DE SESSÃO ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        if (snap.exists()) {
            document.getElementById('user-display').innerText = snap.data().nome;
            // Esconde telas de login/cadastro e mostra a rifa
            document.getElementById('tela-cadastro').style.display = 'none';
            document.getElementById('tela-login').style.display = 'none';
            document.getElementById('tela-rifa').style.display = 'block';
            document.getElementById('btnSair').style.display = 'block';
            iniciarRifa();
        }
    }
});

document.getElementById('btnSair').onclick = () => signOut(auth).then(() => location.reload());

// --- LÓGICA DA RIFA ---
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

    // Monitoramento em tempo real de números vendidos no Firebase
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
    const total = selecionados.length * 5; // Valor unitário R$ 5,00
    document.getElementById('qtd').innerText = selecionados.length;
    document.getElementById('total').innerText = "R$ " + total.toFixed(2);
}

// --- BOTÃO GERAR PIX (CONEXÃO COM RENDER) ---
document.getElementById('btnPagar').onclick = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Faça login para continuar!");
    if (selecionados.length === 0) return alert("Selecione ao menos um número!");

    const snap = await getDoc(doc(db, "usuarios", user.uid));
    const dadosUsuario = snap.data();

    try {
        const resposta = await fetch('https://minirifa-pro.onrender.com/gerar-pix', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: dadosUsuario.nome,
                telefone: dadosUsuario.telefone,
                numeros: selecionados,
                total: document.getElementById('total').innerText
            })
        });

        const d = await resposta.json();
        if (d.copy_paste) {
            prompt("🤖 PIX GERADO!\nCopie o código abaixo:", d.copy_paste);
        } else {
            alert("Erro ao processar pagamento.");
        }
    } catch (e) { 
        alert("O servidor está acordando... Tente novamente em 30 segundos!"); 
    }
};
