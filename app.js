/* === INÍCIO DO APP.JS COMPLETO E INTEGRADO === */

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

/* === LÓGICA DE AUTENTICAÇÃO === */
window.cadastrar = async () => {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const refCodeInput = document.getElementById('ref-code').value;

    if (!nome || !email || !senha) return alert("Preencha todos os campos!");

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
            vendasTotais: 0,
            dataCriacao: new Date()
        });
        location.reload();
    } catch (e) { alert("Erro ao cadastrar: " + e.message); }
};

window.login = async () => {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    try {
        await signInWithEmailAndPassword(auth, email, senha);
    } catch (e) { alert("E-mail ou senha incorretos."); }
};

window.sair = () => signOut(auth).then(() => location.reload());

/* === MONITORAMENTO DE ESTADO DO USUÁRIO === */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        usuarioAtual = user;
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('tela-rifa').classList.remove('hidden');
        
        // Escuta em tempo real dos dados do usuário (Saldo, Vendas, etc)
        onSnapshot(doc(db, "usuarios", user.uid), (d) => {
            if (d.exists()) {
                const data = d.data();
                document.getElementById('user-display').innerText = data.nome;
                document.getElementById('saldo-pontos').innerText = data.saldo.toFixed(2);
                document.getElementById('meu-codigo-txt').innerText = data.meuCodigo;
                document.getElementById('ponto-semana').innerText = data.vendasTotais;
                
                // Gera os grids baseados nas vendas do usuário para liberar fases
                gerarGrids(data.vendasTotais);
            }
        });

        carregarRanking();
    } else {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('tela-rifa').classList.add('hidden');
    }
});

/* === SISTEMA DE GANHOS PASSIVOS === */
window.fazerCheckin = async () => {
    try {
        await updateDoc(doc(db, "usuarios", usuarioAtual.uid), { saldo: increment(0.05) });
        alert("Check-in diário realizado! +R$ 0,05");
    } catch (e) { console.error(e); }
};

window.assistirPropaganda = () => {
    const btn = document.getElementById('btn-video');
    const timerTxt = document.getElementById('timer-video');
    btn.disabled = true;
    timerTxt.classList.remove('hidden');
    
    let tempo = 30;
    const intervalo = setInterval(async () => {
        tempo--;
        document.getElementById('segundos').innerText = tempo;
        if (tempo <= 0) {
            clearInterval(intervalo);
            await updateDoc(doc(db, "usuarios", usuarioAtual.uid), { saldo: increment(0.10) });
            timerTxt.classList.add('hidden');
            btn.disabled = false;
            alert("Recompensa de vídeo creditada! +R$ 0,10");
        }
    }, 1000);
};

/* === GERENCIAMENTO DAS RIFAS (GRIDS) === */
function gerarGrids(vendas) {
    const configs = [
        { id: 'grid-fase1', min: 1, max: 50 },
        { id: 'grid-fase2', min: 51, max: 100 },
        { id: 'grid-fase3', min: 101, max: 150 }
    ];
    
    configs.forEach((config) => {
        const container = document.getElementById(config.id);
        if (!container) return;
        container.innerHTML = "";
        for (let i = config.min; i <= config.max; i++) {
            const btn = document.createElement('button');
            btn.className = 'num';
            btn.innerText = i;
            // Verifica se o número já foi selecionado nesta sessão
            if (numerosSelecionados.includes(i)) btn.classList.add('selecionado');
            
            btn.onclick = () => alternarSelecao(i, btn);
            container.appendChild(btn);
        }
    });

    // Lógica de bloqueio visual das fases
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

/* === RANKING E PAGAMENTO === */
function carregarRanking() {
    const q = query(collection(db, "usuarios"), orderBy("indicacoesSemana", "desc"), limit(3));
    onSnapshot(q, (snap) => {
        const premios = ["R$ 15,00", "R$ 10,00", "R$ 5,00"];
        const icones = ["🥇", "🥈", "🥉"];
        let html = "";
        let i = 0;
        snap.forEach(d => {
            html += `<p><span>${icones[i]} ${d.data().nome} (${premios[i]})</span> <b>${d.data().indicacoesSemana || 0} pts</b></p>`;
            i++;
        });
        const lista = document.getElementById('ranking-lista');
        if (lista) lista.innerHTML = html;
    });
}

window.gerarPix = () => {
    alert("Iniciando pagamento via PIX para os números: " + numerosSelecionados.join(', '));
    // Aqui entrará a lógica de integração com API de pagamento (Mercado Pago, EFI, etc)
};

/* === FIM DO APP.JS COMPLETO === */
