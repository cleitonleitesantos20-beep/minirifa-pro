import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, collection, query, orderBy, limit, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- CONFIGURAÇÃO ---
const firebaseConfig = { /* COLE SUAS CHAVES AQUI */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let selecionados = [];
const PRECO_UNITARIO = 10.00;

// --- 1. MONITORAMENTO DA RIFA E FASES ---
onSnapshot(doc(db, "config", "sorteio"), (snap) => {
    if (snap.exists()) {
        const d = snap.data();
        const vendidos = d.vendidos || 0;
        document.getElementById('vendas-contagem').innerText = vendidos;
        document.getElementById('data-txt').innerText = d.dataSorteio || "31/01 às 20h";

        // Lógica de Desbloqueio Visual
        if (vendidos >= 50) {
            document.getElementById('fase2-ui').classList.remove('locked');
            document.getElementById('meta-max').innerText = "100";
        } else {
            document.getElementById('fase2-ui').classList.add('locked');
            document.getElementById('meta-max').innerText = "50";
        }
        renderizarGrids(vendidos);
    }
});

// --- 2. RANKING TOP 3 ---
const qRanking = query(collection(db, "usuarios"), orderBy("indicacoesVendas", "desc"), limit(3));
onSnapshot(qRanking, (snap) => {
    let html = "";
    let cont = 1;
    snap.forEach(u => {
        html += `<p><b>${cont}º</b> ${u.data().nome} — ${u.data().indicacoesVendas || 0} vendas</p>`;
        cont++;
    });
    document.getElementById('ranking-lista').innerHTML = html || "Aguardando indicações...";
});

// --- 3. AUTENTICAÇÃO E PERFIL ---
window.cadastrar = async () => {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const ref = document.getElementById('ref-code').value;

    try {
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        const meuCod = nome.substring(0,3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
        
        await setDoc(doc(db, "usuarios", res.user.uid), {
            nome, email, meuCodigo: meuCod, indicacoesVendas: 0, quemMeIndicou: ref || null, pontosCheckin: 0
        });
        alert("Conta criada com sucesso!");
    } catch (e) { alert("Erro: " + e.message); }
};

window.login = async () => {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    try { await signInWithEmailAndPassword(auth, email, senha); } 
    catch (e) { alert("Erro ao entrar: " + e.message); }
};

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

// --- 4. CHECK-IN DIÁRIO ---
window.fazerCheckin = async () => {
    const user = auth.currentUser;
    const hoje = new Date().toLocaleDateString();
    const uRef = doc(db, "usuarios", user.uid);
    const uSnap = await getDoc(uRef);

    if (uSnap.data().ultimoCheckin === hoje) {
        alert("Você já garantiu o check-in de hoje! 📅");
    } else {
        await updateDoc(uRef, { ultimoCheckin: hoje, pontosCheckin: increment(1) });
        alert("📍 Check-in realizado! Acompanhe o site diariamente.");
    }
};

// --- 5. LÓGICA DA RIFA (DESENHAR NÚMEROS) ---
function renderizarGrids(vendidosTotais) {
    const g1 = document.getElementById('grid-fase1');
    const g2 = document.getElementById('grid-fase2');
    g1.innerHTML = ""; g2.innerHTML = "";

    for (let i = 1; i <= 100; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = i <= vendidosTotais ? 'num vendido' : 'num';
        btn.onclick = () => selecionar(i);
        
        if (i <= 50) g1.appendChild(btn);
        else g2.appendChild(btn);
    }
}

function selecionar(n) {
    const idx = selecionados.indexOf(n);
    if (idx > -1) selecionados.splice(idx, 1);
    else selecionados.push(n);
    
    document.getElementById('payment-area').classList.remove('hidden');
    document.getElementById('num-selecionados').innerText = selecionados.join(', ');
    document.getElementById('total-pagar').innerText = (selecionados.length * PRECO_UNITARIO).toFixed(2);
}

// --- 6. INTEGRAÇÃO COM O ROBÔ (RENDER) ---
window.gerarPix = async () => {
    const res = await fetch("https://seu-servidor.onrender.com/gerar-pix", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            nome: document.getElementById('user-display').innerText,
            numeros: selecionados,
            total: selecionados.length * PRECO_UNITARIO
        })
    });
    const data = await res.json();
    alert("Copie o PIX: " + data.copy_paste);
};
