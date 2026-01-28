// 1. IMPORTAÇÕES DOS MÓDULOS FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, collection, query, orderBy, limit, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 2. CONFIGURAÇÃO REAL DO SEU PROJETO
const firebaseConfig = {
  apiKey: "AIzaSyAYO5RWaJy5y7r7jvzFk3wq-ByqM_dWWO8",
  authDomain: "minharifadigital.firebaseapp.com",
  projectId: "minharifadigital",
  storageBucket: "minharifadigital.firebasestorage.app",
  messagingSenderId: "59630725905",
  appId: "1:59630725905:web:396c8cfca385dc3d957ab0",
  measurementId: "G-195QMHMXML"
};

// Inicialização das Ferramentas
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let selecionados = [];
const PRECO_UNITARIO = 10.00;

// 3. MONITORAMENTO DO SORTEIO E FASES (TIRA O "CARREGANDO")
onSnapshot(doc(db, "config", "sorteio"), (snap) => {
    if (snap.exists()) {
        const d = snap.data();
        const vendidos = d.vendidos || 0;
        
        // Atualiza interface topo
        document.getElementById('vendas-contagem').innerText = vendidos;
        document.getElementById('data-txt').innerText = d.dataSorteio || "31/01 às 20h";

        // Lógica de Desbloqueio das Fases
        const fase2Ui = document.getElementById('fase2-ui');
        if (vendidos >= 50) {
            fase2Ui.classList.remove('locked');
            document.getElementById('meta-max').innerText = "100";
        } else {
            fase2Ui.classList.add('locked');
            document.getElementById('meta-max').innerText = "50";
        }
        
        renderizarGrids(vendidos);
    }
});

// 4. RANKING DE INDICADORES EM TEMPO REAL
const qRanking = query(collection(db, "usuarios"), orderBy("indicacoesVendas", "desc"), limit(3));
onSnapshot(qRanking, (snap) => {
    let html = "";
    let cont = 1;
    snap.forEach(u => {
        html += `<p><b>${cont}º</b> ${u.data().nome} — ${u.data().indicacoesVendas || 0} vendas</p>`;
        cont++;
    });
    document.getElementById('ranking-lista').innerHTML = html || "Buscando líderes...";
});

// 5. SISTEMA DE AUTENTICAÇÃO (LOGIN E CADASTRO)
window.cadastrar = async () => {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const ref = document.getElementById('ref-code').value;

    try {
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        const meuCod = nome.substring(0,3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
        
        // Cria perfil organizado no Firestore
        await setDoc(doc(db, "usuarios", res.user.uid), {
            nome: nome,
            email: email,
            meuCodigo: meuCod,
            indicacoesVendas: 0,
            pontosCheckin: 0,
            quemMeIndicou: ref || null
        });
        alert("Conta Criada! Bem-vindo ao sistema.");
    } catch (e) { alert("Erro: " + e.message); }
};

window.login = async () => {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    try { await signInWithEmailAndPassword(auth, email, senha); } 
    catch (e) { alert("Falha no login: " + e.message); }
};

// Observador de Login para carregar Dashboard
onAuthStateChanged(auth, (user) => {
    if (user) {
        onSnapshot(doc(db, "usuarios", user.uid), (uSnap) => {
            if (uSnap.exists()) {
                const d = uSnap.data();
                document.getElementById('user-display').innerText = d.nome;
                document.getElementById('meu-codigo-txt').innerText = d.meuCodigo;
                document.getElementById('ponto-indicacao').innerText = `${d.indicacoesVendas || 0}/3`;
                
                document.getElementById('auth-section').classList.add('hidden');
                document.getElementById('tela-rifa').classList.remove('hidden');
            }
        });
    }
});

// 6. CHECK-IN DIÁRIO
window.fazerCheckin = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const uRef = doc(db, "usuarios", user.uid);
    const uSnap = await getDoc(uRef);
    const hoje = new Date().toLocaleDateString();

    if (uSnap.data().ultimoCheckin === hoje) {
        alert("Check-in já realizado hoje! ⚡");
    } else {
        await updateDoc(uRef, { ultimoCheckin: hoje, pontosCheckin: increment(1) });
        alert("📍 +1 dia de atividade registrado!");
    }
};

// 7. RENDERIZAÇÃO DOS NÚMEROS (RIFA)
function renderizarGrids(vendidosTotais) {
    const g1 = document.getElementById('grid-fase1');
    const g2 = document.getElementById('grid-fase2');
    g1.innerHTML = ""; g2.innerHTML = "";

    for (let i = 1; i <= 100; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = i <= vendidosTotais ? 'num vendido' : 'num';
        
        // Só permite clicar se não estiver vendido e se for Fase 1 OU Fase 2 desbloqueada
        btn.onclick = () => {
            if (i > 50 && vendidosTotais < 50) return;
            selecionar(i);
        };
        
        if (i <= 50) g1.appendChild(btn);
        else g2.appendChild(btn);
    }
}

function selecionar(n) {
    const btn = event.target;
    if (btn.classList.contains('vendido')) return;

    const idx = selecionados.indexOf(n);
    if (idx > -1) {
        selecionados.splice(idx, 1);
        btn.classList.remove('selecionado');
    } else {
        selecionados.push(n);
        btn.classList.add('selecionado');
    }
    
    // Atualiza área de pagamento
    const payArea = document.getElementById('payment-area');
    if (selecionados.length > 0) {
        payArea.classList.remove('hidden');
        document.getElementById('num-selecionados').innerText = selecionados.join(', ');
        document.getElementById('total-pagar').innerText = (selecionados.length * PRECO_UNITARIO).toFixed(2);
    } else {
        payArea.classList.add('hidden');
    }
}
