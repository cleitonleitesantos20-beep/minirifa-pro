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
    } catch (e) { alert(e.message); }
};

window.login = async () => {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    try { await signInWithEmailAndPassword(auth, email, senha); } catch (e) { alert("Erro no login"); }
};

window.sair = () => signOut(auth).then(() => location.reload());

onAuthStateChanged(auth, (user) => {
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

window.fazerCheckin = async () => {
    await updateDoc(doc(db, "usuarios", usuarioAtual.uid), { saldo: increment(0.05) });
    alert("Saldo atualizado!");
};

window.assistirPropaganda = () => {
    let tempo = 30;
    document.getElementById('btn-video').disabled = true;
    document.getElementById('timer-video').classList.remove('hidden');
    const inter = setInterval(async () => {
        tempo--;
        document.getElementById('segundos').innerText = tempo;
        if (tempo <= 0) {
            clearInterval(inter);
            await updateDoc(doc(db, "usuarios", usuarioAtual.uid), { saldo: increment(0.10) });
            document.getElementById('timer-video').classList.add('hidden');
            document.getElementById('btn-video').disabled = false;
        }
    }, 1000);
};

function gerarGrids(vendas) {
    const configs = [{id:'grid-fase1',m:1,x:50},{id:'grid-fase2',m:51,x:100},{id:'grid-fase3',m:101,x:150}];
    configs.forEach(c => {
        const el = document.getElementById(c.id);
        if(!el) return;
        el.innerHTML = "";
        for(let i=c.m; i<=c.x; i++) {
            const b = document.createElement('button');
            b.className = 'num';
            b.innerText = i;
            if(numerosSelecionados.includes(i)) b.classList.add('selecionado');
            b.onclick = () => {
                if(numerosSelecionados.includes(i)) numerosSelecionados = numerosSelecionados.filter(n=>n!==i);
                else numerosSelecionados.push(i);
                gerarGrids(vendas);
                document.getElementById('payment-area').classList.toggle('hidden', numerosSelecionados.length === 0);
                document.getElementById('num-selecionados').innerText = numerosSelecionados.join(', ');
                document.getElementById('total-pagar').innerText = (numerosSelecionados.length * 7).toFixed(2);
            };
            el.appendChild(b);
        }
    });
    document.getElementById('fase2-ui').classList.toggle('locked', vendas < 50);
    document.getElementById('fase3-ui').classList.toggle('locked', vendas < 100);
}

function carregarRanking() {
    const q = query(collection(db, "usuarios"), orderBy("indicacoesSemana", "desc"), limit(3));
    onSnapshot(q, (s) => {
        let h = "";
        const icons = ["🥇","🥈","🥉"];
        s.forEach((d, i) => {
            h += `<p>${icons[i]} ${d.data().nome} <b>${d.data().indicacoesSemana} pts</b></p>`;
        });
        document.getElementById('ranking-lista').innerHTML = h;
    });
}

window.gerarPix = () => alert("Redirecionando para PIX...");
