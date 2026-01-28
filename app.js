import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, collection, query, orderBy, limit, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. CONFIGURAÇÃO FIREBASE
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
const PRECO_UNITARIO = 7.00;

// 2. SISTEMA DE LOGIN E CADASTRO
window.login = async () => {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    try { 
        await signInWithEmailAndPassword(auth, email, senha); 
    } catch (e) { alert("Erro ao entrar: " + e.message); }
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
        alert("Conta criada com sucesso!");
    } catch (e) { alert("Erro no cadastro: " + e.message); }
};

// 3. CHECK-IN DIÁRIO (BÔNUS R$ 0,10)
window.fazerCheckin = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const uRef = doc(db, "usuarios", user.uid);
    const uSnap = await getDoc(uRef);
    const hoje = new Date().toLocaleDateString();

    if (uSnap.data().ultimoCheckin === hoje) {
        alert("🤖 Você já resgatou seu prêmio de hoje!");
    } else {
        await updateDoc(uRef, { 
            ultimoCheckin: hoje, 
            saldoPontos: increment(0.10) 
        });
        alert("📍 +R$ 0,10 adicionados ao seu saldo!");
    }
};

// 4. LÓGICA DE DATAS E MONITORAMENTO
function obterUltimoDiaMes() {
    const data = new Date();
    const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0);
    return ultimoDia.toLocaleDateString('pt-br');
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Atualiza perfil e saldo
        onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
            const d = snap.data();
            document.getElementById('user-display').innerText = d.nome;
            document.getElementById('meu-codigo-txt').innerText = d.meuCodigo;
            document.getElementById('ponto-semana').innerText = d.indicacoesSemana || 0;
            document.getElementById('saldo-pontos').innerText = (d.saldoPontos || 0).toFixed(2);
            
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('tela-rifa').classList.remove('hidden');
        });

        // Monitora Sorteio, Fases e Números Vendidos
        onSnapshot(doc(db, "config", "sorteio"), (snap) => {
            const d = snap.data() || { vendidos: 0, numerosComprados: [] };
            const vendidosTotais = d.vendidos || 0;
            const comprados = d.numerosComprados || [];
            
            document.getElementById('area-resultado').innerText = `📅 PRÓXIMO SORTEIO: ${obterUltimoDiaMes()}`;
            
            // Desbloqueio de Fases
            if (vendidosTotais >= 50) document.getElementById('fase2-ui').classList.remove('locked');
            if (vendidosTotais >= 100) document.getElementById('fase3-ui').classList.remove('locked');
            
            renderizarTodasFases(comprados);
        });

        // Ranking de Indicadores
        const qRanking = query(collection(db, "usuarios"), orderBy("indicacoesSemana", "desc"), limit(3));
        onSnapshot(qRanking, (snap) => {
            let html = "";
            snap.forEach(u => {
                html += `<p><span>${u.data().nome}</span> <b>${u.data().indicacoesSemana || 0} vendas</b></p>`;
            });
            document.getElementById('ranking-lista').innerHTML = html;
        });
    }
});

// 5. GRID DE NÚMEROS E CHECKOUT
function renderizarTodasFases(comprados) {
    for (let f = 1; f <= 3; f++) {
        const grid = document.getElementById(`grid-fase${f}`);
        grid.innerHTML = "";
        const inicio = (f - 1) * 50 + 1;
        const fim = f * 50;

        for (let i = inicio; i <= fim; i++) {
            const btn = document.createElement('button');
            btn.innerText = i;
            
            if (comprados.includes(i)) {
                btn.className = 'num comprado';
            } else if (selecionados.includes(i)) {
                btn.className = 'num selecionado';
            } else {
                btn.className = 'num';
            }

            btn.onclick = () => {
                if (comprados.includes(i)) return;
                const idx = selecionados.indexOf(i);
                if (idx > -1) {
                    selecionados.splice(idx, 1);
                } else {
                    selecionados.push(i);
                }
                renderizarTodasFases(comprados);
                atualizarCheckout();
            };
            grid.appendChild(btn);
        }
    }
}

function atualizarCheckout() {
    const area = document.getElementById('payment-area');
    if (selecionados.length > 0) {
        area.classList.remove('hidden');
        document.getElementById('num-selecionados').innerText = selecionados.join(', ');
        document.getElementById('total-pagar').innerText = (selecionados.length * PRECO_UNITARIO).toFixed(2);
    } else {
        area.classList.add('hidden');
    }
}

// 6. LÓGICA DE ARRASTAR COM O MOUSE (PC)
const slider = document.querySelector('.fases-wrapper');
let isDown = false; let startX; let scrollLeft;

slider.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
});
slider.addEventListener('mouseleave', () => isDown = false);
slider.addEventListener('mouseup', () => isDown = false);
slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2;
    slider.scrollLeft = scrollLeft - walk;
});
// 7. FUNÇÃO DE PAGAMENTO (GERAR PIX)
window.gerarPix = async () => {
    if (selecionados.length === 0) return alert("Selecione ao menos um número!");

    const valorTotal = (selecionados.length * PRECO_UNITARIO).toFixed(2);
    const user = auth.currentUser;

    // Aqui simulamos a criação do pedido no banco de dados
    const pedidoId = "PX" + Math.floor(1000 + Math.random() * 9000);
    
    // Alerta estilizado simulando o sistema de pagamento
    const confirmacao = confirm(`🚀 ROBOSORTEIO - PEDIDO ${pedidoId}\n\nVocê selecionou os números: ${selecionados.join(', ')}\nValor Total: R$ ${valorTotal}\n\nDeseja gerar o código PIX Copia e Cola?`);

    if (confirmacao) {
        // No futuro, aqui você conectará com a API do Mercado Pago ou Efí
        const pixFake = "00020126580014BR.GOV.BCB.PIX0136suachavepixaqui12345678905204000053039865404" + valorTotal + "5802BR5913ROBOSORTEIO6008BRASILIA62070503***6304E2B1";
        
        // Copia automaticamente para a área de transferência
        navigator.clipboard.writeText(pixFake).then(() => {
            alert("✅ CÓDIGO PIX COPIADO!\n\nCole no seu banco para pagar R$ " + valorTotal + ".\n\nApós o pagamento, seus números ficarão vermelhos em instantes.");
            
            // Limpa a seleção após "gerar" o pix
            selecionados = [];
            document.getElementById('payment-area').classList.add('hidden');
            // Aqui você chamaria a renderização para atualizar o visual
            // renderizarTodasFases([]); 
        });
    }
};
