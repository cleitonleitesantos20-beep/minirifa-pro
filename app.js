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

let usuarioAtual = null;
let numerosSelecionados = [];

window.cadastrar = async () => {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const refCode = document.getElementById('ref-code').value;

    if (!nome || !email || !senha) return alert("Preencha os campos!");
    try {
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        const meuCodigo = nome.substring(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
        await setDoc(doc(db, "usuarios", res.user.uid), {
            nome, email, saldo: 0, meuCodigo, indicadoPor: refCode || null, indicacoesSemana: 0, vendasTotais: 0
        });
        location.reload();
    } catch (e) { alert("Erro ao cadastrar: " + e.message); }
};

window.login = async () => {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    try { await signInWithEmailAndPassword(auth, email, senha); } catch (e) { alert("Dados incorretos."); }
};

window.sair = () => signOut(auth).then(() => location.reload());

onAuthStateChanged(auth, (user) => {
    if (user) {
        usuarioAtual = user;
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('tela-rifa').classList.remove('hidden');
        onSnapshot(doc(db, "usuarios", user.uid), (d) => {
            const data = d.data();
            if(data) {
                document.getElementById('user-display').innerText = data.nome;
                document.getElementById('saldo-pontos').innerText = data.saldo.toFixed(2);
                document.getElementById('meu-codigo-txt').innerText = data.meuCodigo;
                document.getElementById('ponto-semana').innerText = data.vendasTotais;
                gerarGrids(data.vendasTotais);
            }
        });
        carregarRanking();
    }
});

window.fazerCheckin = async () => {
    try {
        await updateDoc(doc(db, "usuarios", usuarioAtual.uid), { saldo: increment(0.05) });
        alert("Check-in: +R$ 0,05");
    } catch (e) { console.error(e); }
};

window.assistirPropaganda = () => {
    let tempo = 30;
    const btn = document.getElementById('btn-video');
    const timerArea = document.getElementById('timer-video');
    btn.disabled = true;
    timerArea.classList.remove('hidden');
    
    const inter = setInterval(async () => {
        tempo--;
        document.getElementById('segundos').innerText = tempo;
        if (tempo <= 0) {
            clearInterval(inter);
            await updateDoc(doc(db, "usuarios", usuarioAtual.uid), { saldo: increment(0.10) });
            timerArea.classList.add('hidden');
            btn.disabled = false;
            alert("Vídeo: +R$ 0,10");
        }
    }, 1000);
};

function gerarGrids(vendas) {
    const configs = [
        {id:'grid-fase1', min:1, max:50},
        {id:'grid-fase2', min:51, max:100},
        {id:'grid-fase3', min:101, max:150}
    ];

    configs.forEach(conf => {
        const container = document.getElementById(conf.id);
        if(!container) return;
        container.innerHTML = "";
        for(let i = conf.min; i <= conf.max; i++) {
            const btn = document.createElement('button');
            btn.className = 'num';
            btn.innerText = i;
            if(numerosSelecionados.includes(i)) btn.classList.add('selecionado');
            btn.onclick = () => {
                if(numerosSelecionados.includes(i)) {
                    numerosSelecionados = numerosSelecionados.filter(n => n !== i);
                } else {
                    numerosSelecionados.push(i);
                }
                atualizarCheckout();
                gerarGrids(vendas);
            };
            container.appendChild(btn);
        }
    });

    document.getElementById('fase2-ui').classList.toggle('locked', vendas < 50);
    document.getElementById('fase3-ui').classList.toggle('locked', vendas < 100);
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

function carregarRanking() {
    const q = query(collection(db, "usuarios"), orderBy("indicacoesSemana", "desc"), limit(3));
    onSnapshot(q, (snap) => {
        let h = "";
        const icons = ["🥇","🥈","🥉"];
        let i = 0;
        snap.forEach(d => {
            const u = d.data();
            // Correção do undefined: usa fallback caso o nome não exista
            const nomeExibicao = u.nome || "Usuário";
            h += `<p><span>${icons[i] || ""} ${nomeExibicao}</span> <b>${u.indicacoesSemana || 0} pts</b></p>`;
            i++;
        });
        const listEl = document.getElementById('ranking-lista');
        if(listEl) listEl.innerHTML = h;
    });
}

window.gerarPix = () => alert("Redirecionando para o pagamento...");
