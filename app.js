import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, collection, query, orderBy, limit, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. CONFIGURAÇÃO (SUAS CHAVES)
const firebaseConfig = {
  apiKey: "AIzaSyAYO5RWaJy5y7r7jvzFk3wq-ByqM_dWWO8",
  authDomain: "minharifadigital.firebaseapp.com",
  projectId: "minharifadigital",
  storageBucket: "minharifadigital.firebasestorage.app",
  messagingSenderId: "59630725905",
  appId: "1:59630725905:web:396c8cfca385dc3d957ab0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let selecionados = [];
const PRECO_UNITARIO = 7.00; // Valor atualizado para R$ 7,00

// 2. UTILITÁRIOS: DATA DO SORTEIO
function obterUltimoDiaMes() {
    const data = new Date();
    const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0);
    return ultimoDia.toLocaleDateString('pt-br');
}

// 3. ACESSO: LOGIN E CADASTRO
window.login = async () => {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    try { await signInWithEmailAndPassword(auth, email, senha); } 
    catch (e) { alert("Falha no login: " + e.message); }
};

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
            ultimoCheckin: "",
            quemMeIndicou: ref || null
        });
        alert("Conta Robótica criada com sucesso!");
    } catch (e) { alert("Erro no cadastro: " + e.message); }
};

// 4. CHECK-IN DIÁRIO (R$ 0,10 PROGRESSIVO)
window.fazerCheckin = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const uRef = doc(db, "usuarios", user.uid);
    const uSnap = await getDoc(uRef);
    const hoje = new Date().toLocaleDateString();

    if (uSnap.data().ultimoCheckin === hoje) {
        alert("🤖 Sistema: Você já coletou seu bônus hoje!");
    } else {
        await updateDoc(uRef, { 
            ultimoCheckin: hoje, 
            saldoPontos: increment(0.10) 
        });
        alert("📍 +R$ 0,10 adicionados ao seu saldo!");
    }
};

// 5. MONITORAMENTO EM TEMPO REAL
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Dados do Usuário
        onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
            const d = snap.data();
            document.getElementById('user-display').innerText = d.nome;
            document.getElementById('meu-codigo-txt').innerText = d.meuCodigo;
            document.getElementById('ponto-semana').innerText = d.indicacoesSemana || 0;
            document.getElementById('saldo-pontos').innerText = (d.saldoPontos || 0).toFixed(2);
            
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('tela-rifa').classList.remove('hidden');
        });

        // Configuração do Sorteio e Fases
        onSnapshot(doc(db, "config", "sorteio"), (snap) => {
            const d = snap.data() || { vendidos: 0, numerosComprados: [] };
            const vendidosTotais = d.vendidos || 0;
            const comprados = d.numerosComprados || [];
            
            // Atualiza Data e Fases
            document.getElementById('area-resultado').innerText = `📅 PRÓXIMO SORTEIO: ${obterUltimoDiaMes()}`;
            
            if (vendidosTotais >= 50) document.getElementById('fase2-ui').classList.remove('locked');
            if (vendidosTotais >= 100) document.getElementById('fase3-ui').classList.remove('locked');
            
            renderizarTodasFases(comprados);
        });

        // Ranking Top 3 no Rodapé
        const qRanking = query(collection(db, "usuarios"), orderBy("indicacoesSemana", "desc"), limit(3));
        onSnapshot(qRanking, (snap) => {
            let html = "";
            snap.forEach(u => {
                html += `<p><span>${u.data().nome}</span> <b>${u.data().indicacoesSemana || 0} vendas</b></p>`;
            });
            document.getElementById('ranking-lista').innerHTML = html || "Aguardando competidores...";
        });
    }
});

// 6. RENDERIZAÇÃO E SELEÇÃO (VERDE/VERMELHO)
function renderizarTodasFases(comprados) {
    for (let f = 1; f <= 3; f++) {
        const grid = document.getElementById(`grid-fase${f}`);
        grid.innerHTML = "";
        const inicio = (f - 1) * 50 + 1;
        const fim = f * 50;

        for (let i = inicio; i <= fim; i++) {
            const btn = document.createElement('button');
            btn.innerText = i;
            
            // Lógica de cores: Vermelho se já foi comprado
            if (comprados.includes(i)) {
                btn.className = 'num comprado';
            } else if (selecionados.includes(i)) {
                btn.className = 'num selecionado';
            } else {
                btn.className = 'num';
            }

            btn.onclick = () => alternarSelecao(i, btn, comprados);
            grid.appendChild(btn);
        }
    }
}

function alternarSelecao(n, btn, comprados) {
    if (comprados.includes(n)) return;

    const idx = selecionados.indexOf(n);
    if (idx > -1) {
        selecionados.splice(idx, 1);
        btn.classList.remove('selecionado');
    } else {
        selecionados.push(n);
        btn.classList.add('selecionado');
    }
    atualizarInterfaceCheckout();
}

function atualizarInterfaceCheckout() {
    const area = document.getElementById('payment-area');
    if (selecionados.length > 0) {
        area.classList.remove('hidden');
        document.getElementById('num-selecionados').innerText = selecionados.join(', ');
        document.getElementById('total-pagar').innerText = (selecionados.length * PRECO_UNITARIO).toFixed(2);
    } else {
        area.classList.add('hidden');
    }
}
