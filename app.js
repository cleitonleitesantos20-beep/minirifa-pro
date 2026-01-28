import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURAÇÃO FIREBASE (Mantenha a sua aqui) ---
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
const PRECO_UNITARIO = 5.00;

// --- 1. CADASTRO COM SISTEMA DE INDICAÇÃO ---
window.registrarUsuario = async () => {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const senha = document.getElementById('reg-senha').value;
    const tel = document.getElementById('reg-tel').value;
    const quemIndicou = document.getElementById('reg-indicacao').value;

    if(!nome || !email || !senha) return alert("Preencha os campos obrigatórios!");

    try {
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        const meuCod = res.user.uid.substring(0, 5).toUpperCase();
        
        await setDoc(doc(db, "usuarios", res.user.uid), {
            nome, email, telefone: tel,
            meuCodigo: meuCod,
            indicadoPor: quemIndicou || null,
            indicacoesVendas: 0,
            planoAtivo: false
        });
        alert("Conta VIP Criada! Seu código: " + meuCod);
        location.reload();
    } catch (e) { alert("Erro ao cadastrar: " + e.message); }
};

// --- 2. LOGIN E LOGOUT ---
window.fazerLogin = async () => {
    const email = document.getElementById('log-email').value;
    const senha = document.getElementById('log-senha').value;
    try { await signInWithEmailAndPassword(auth, email, senha); } 
    catch (e) { alert("Dados inválidos!"); }
};

window.logout = () => signOut(auth).then(() => location.reload());

// --- 3. MONITOR DE SESSÃO E EVOLUÇÃO DA RIFA ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const uSnap = await getDoc(doc(db, "usuarios", user.uid));
        const uDados = uSnap.data();
        
        document.getElementById('user-display').innerText = uDados.nome;
        document.getElementById('meu-codigo-txt').innerText = uDados.meuCodigo;
        document.getElementById('ponto-indicacao').innerText = `${uDados.indicacoesVendas}/3`;
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('tela-rifa').classList.remove('hidden');

        // Escuta em tempo real a Meta Evolutiva [cite: 2026-01-28]
        onSnapshot(doc(db, "config", "sorteio"), (doc) => {
            const totalNumeros = doc.data()?.total || 50;
            const vendidos = doc.data()?.vendidos || 0;
            
            document.getElementById('vendas-contagem').innerText = vendidos;
            document.getElementById('meta-max').innerText = totalNumeros;
            desenharRifa(totalNumeros);
        });
    }
});

// --- 4. LÓGICA DO GRID DA RIFA ---
function desenharRifa(qtd) {
    const grid = document.getElementById('gridRifa');
    grid.innerHTML = '';
    for (let i = 1; i <= qtd; i++) {
        const div = document.createElement('div');
        div.className = 'num';
        div.innerText = i;
        if(selecionados.includes(i)) div.classList.add('selected');

        div.onclick = () => {
            if (selecionados.includes(i)) {
                selecionados = selecionados.filter(x => x !== i);
                div.classList.remove('selected');
            } else {
                selecionados.push(i);
                div.classList.add('selected');
            }
            atualizarValores();
        };
        grid.appendChild(div);
    }
}

function atualizarValores() {
    const total = selecionados.length * PRECO_UNITARIO;
    document.getElementById('qtd').innerText = selecionados.length;
    document.getElementById('total').innerText = "R$ " + total.toFixed(2);
}

// --- 5. PAGAMENTO HÍBRIDO (PIX E CARTÃO) ---

// PAGAR AVULSO (PIX)
window.pagarPix = async () => {
    if (selecionados.length === 0) return alert("Selecione números primeiro!");
    
    try {
        const res = await fetch('https://minirifa-pro.onrender.com/gerar-pix', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                nome: document.getElementById('user-display').innerText,
                numeros: selecionados,
                total: document.getElementById('total').innerText
            })
        });
        const d = await res.json();
        prompt("PIX GERADO! Copie o código abaixo:", d.copy_paste);
    } catch (e) { alert("Servidor offline. Tente em instantes."); }
};

// ASSINAR PLANO (CARTÃO)
window.assinarPlano = async () => {
    const cardData = {
        numero: document.getElementById('card-num').value,
        vencimento: document.getElementById('card-date').value,
        cvv: document.getElementById('card-cvv').value
    };

    if(!cardData.numero || !cardData.cvv) return alert("Preencha os dados do cartão!");

    try {
        const res = await fetch('https://minirifa-pro.onrender.com/assinar-plano', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                nome: document.getElementById('user-display').innerText,
                email: auth.currentUser.email,
                cartao: cardData,
                valorPlano: 30.00 // Exemplo de valor fixo mensal
            })
        });
        const d = await res.json();
        alert(d.msg);
    } catch (e) { alert("Erro ao processar assinatura."); }
};
