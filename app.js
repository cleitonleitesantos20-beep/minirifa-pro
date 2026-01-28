/* === INÍCIO DO APP.JS COMPLETO === */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, onSnapshot, increment } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// CONFIGURAÇÃO FIREBASE
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

let usuarioAtual = null;
let numerosSelecionados = [];

/* === INÍCIO DA AUTENTICAÇÃO E CADASTRO === */
window.cadastrar = async () => {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const refCodeInput = document.getElementById('ref-code').value;

    if (!nome || !email || !senha) return alert("Preencha os campos!");

    try {
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        const uid = res.user.uid;
        const meuCodigo = nome.substring(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);

        await setDoc(doc(db, "usuarios", uid), {
            nome: nome,
            email: email,
            saldo: 0,
            meuCodigo: meuCodigo,
            indicadoPor: refCodeInput || null,
            indicacoesSemana: 0,
            vendasTotais: 0
        });

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

onAuthStateChanged(auth, async (user) => {
    if (user) {
        usuarioAtual = user;
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('tela-rifa').classList.remove('hidden');
        
        onSnapshot(doc(db, "usuarios", user.uid), (d) => {
            const data = d.data();
            document.getElementById('user-display').innerText = data.nome;
            document.getElementById('saldo-pontos').innerText = data.saldo.toFixed(2);
            document.getElementById('meu-codigo-txt').innerText = data.meuCodigo;
            document.getElementById('ponto-semana').innerText = data.vendasTotais;
            gerarGrids(data.vendasTotais);
        });

        carregarRanking();
    }
});
/* === FIM DA AUTENTICAÇÃO === */

/* === INÍCIO LÓGICA DE GANHOS (CHECK-IN E VÍDEO) === */
window.fazerCheckin = async () => {
    await updateDoc(doc(db, "usuarios", usuarioAtual.uid), {
        saldo: increment(0.05)
    });
    alert("Check-in realizado! +R$ 0,05");
};

window.assistirPropaganda = () => {
    const btn = document.getElementById('btn-video');
    btn.disabled = true;
    document.getElementById('timer-video').classList.remove('hidden');
    let tempo = 30;
    const intervalo = setInterval(async () => {
        tempo--;
        document.getElementById('segundos').innerText = tempo;
        if (tempo <= 0) {
            clearInterval(intervalo);
            await updateDoc(doc(db, "usuarios", usuarioAtual.uid), { saldo: increment(0.10) });
            document.getElementById('timer-video').classList.add('hidden');
            btn.disabled = false;
            alert("Vídeo assistido! +R$ 0,10");
        }
    }, 1000);
};
/* === FIM LÓGICA DE GANHOS === */

/* === INÍCIO GRIDS E SELEÇÃO DE NÚMEROS === */
function gerarGrids(vendas) {
    const gridsConfigs = [
        { id: 'grid-fase1', min: 1, max: 50 },
        { id: 'grid-fase2', min: 51, max: 100 },
        { id: 'grid-fase3', min: 101, max: 150 }
    ];
    
    gridsConfigs.forEach((config) => {
        const container = document.getElementById(config.id);
        if (!container) return;
        container.innerHTML = "";
        for (let i = config.min; i <= config.max; i++) {
            const btn = document.createElement('button');
            btn.className = 'num';
            btn.innerText = i;
            btn.onclick = () => alternarSelecao(i, btn);
            container.appendChild(btn);
        }
    });

    if (vendas < 50) document.getElementById('fase2-ui')?.classList.add('locked');
    else document.getElementById('fase2-ui')?.classList.remove('locked');
    
    if (vendas < 100) document.getElementById('fase3-ui')?.classList.add('locked');
    else document.getElementById('fase3-ui')?.classList.remove('locked');
}

function alternarSelecao(n, el) {
    if (numerosSelecionados.includes(n)) {
        numerosSelecionados = numerosSelecionados.filter(x => x !== n);
        el.classList.remove('selecionado');
    } else {
        numerosSelecionados.push(n);
        el.classList.add('selecionado');
    }
    atualizarCheckout();
}

function atualizarCheckout() {
    const area = document.getElementById('payment-area');
    if (numerosSelecionados.length > 0) {
        area.classList.remove('hidden');
        document.getElementById('num-selecionados').innerText = numerosSelecionados.join(', ');
        document.getElementById('total-pagar').innerText = (numerosSelecionados.length * 7).toFixed(2);
    } else {
        area.classList.add('hidden');
    }
}
/* === FIM GRIDS E SELEÇÃO === */

/* === INÍCIO LÓGICA DE PAGAMENTO PIX === */
window.gerarPix = async () => {
    // Espaço para integração de API de pagamento futuramente
    alert("Função de gerar PIX para os números: " + numerosSelecionados.join(', '));
};
/* === FIM LÓGICA DE PAGAMENTO PIX === */

/* === INÍCIO LÓGICA DE RANKING PREMIADO === */
function carregarRanking() {
    const q = query(collection(db, "usuarios"), orderBy("indicacoesSemana", "desc"), limit(3));
    onSnapshot(q, (snap) => {
        const premios = ["R$ 15,00", "R$ 10,00", "R$ 5,00"];
        const icones = ["🥇", "🥈", "🥉"];
        let html = "";
        let i = 0;
        snap.forEach(docSnap => {
            html += `<p><span>${icones[i]} ${docSnap.data().nome} (${premios[i]})</span> <b>${docSnap.data().indicacoesSemana || 0} pts</b></p>`;
            i++;
        });
        const lista = document.getElementById('ranking-lista');
        if (lista) lista.innerHTML = html;
    });
}
/* === FIM LÓGICA DE RANKING PREMIADO === */

/* === FIM DO APP.JS COMPLETO === */
