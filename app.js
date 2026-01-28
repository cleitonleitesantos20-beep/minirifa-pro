import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, collection, query, orderBy, limit, getDoc, setDoc, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

// 2. ACESSO: LOGIN E CADASTRO
window.login = async () => {
    const e = document.getElementById('email').value;
    const s = document.getElementById('senha').value;
    try { await signInWithEmailAndPassword(auth, e, s); } catch(err) { alert(err.message); }
};

window.cadastrar = async () => {
    const n = document.getElementById('reg-nome').value;
    const e = document.getElementById('email').value;
    const s = document.getElementById('senha').value;
    const ref = document.getElementById('ref-code').value; // Código de quem indicou

    try {
        const res = await createUserWithEmailAndPassword(auth, e, s);
        const cod = n.substring(0,3).toUpperCase() + Math.floor(1000 + Math.random()*9000);
        await setDoc(doc(db, "usuarios", res.user.uid), { 
            nome: n, 
            meuCodigo: cod, 
            saldoPontos: 0, 
            indicacoesSemana: 0,
            quemMeIndicou: ref || null,
            jaComprou: false 
        });
        alert("Robô criado com sucesso!");
    } catch(err) { alert(err.message); }
};

// 3. GANHOS: CHECK-IN (R$ 0,05) E VÍDEO (R$ 0,10)
window.fazerCheckin = async () => {
    const user = auth.currentUser;
    const uRef = doc(db, "usuarios", user.uid);
    const snap = await getDoc(uRef);
    const hoje = new Date().toLocaleDateString();
    
    if (snap.data().ultimoCheckin === hoje) return alert("🤖 Check-in já feito hoje!");
    
    await updateDoc(uRef, { 
        ultimoCheckin: hoje, 
        saldoPontos: increment(0.05) // Evolução: 0.05
    });
    alert("📍 +R$ 0,05 adicionados!");
};

window.assistirPropaganda = () => {
    const btn = document.getElementById('btn-video');
    const timerArea = document.getElementById('timer-video');
    const segDisplay = document.getElementById('segundos');
    let tempo = 30; // 30 segundos de "vídeo"

    btn.classList.add('hidden');
    timerArea.classList.remove('hidden');

    const intervalo = setInterval(async () => {
        tempo--;
        segDisplay.innerText = tempo;

        if (tempo <= 0) {
            clearInterval(intervalo);
            const user = auth.currentUser;
            await updateDoc(doc(db, "usuarios", user.uid), { 
                saldoPontos: increment(0.10) 
            });
            timerArea.classList.add('hidden');
            btn.classList.remove('hidden');
            alert("✅ Vídeo assistido! +R$ 0,10 no saldo.");
        }
    }, 1000);
};

// 4. LÓGICA DE INDICAÇÃO (R$ 1,00 AO COMPRAR)
async function pagarBonusIndicador(uidComprador) {
    const compradorRef = doc(db, "usuarios", uidComprador);
    const snap = await getDoc(compradorRef);
    const d = snap.data();

    if (d.quemMeIndicou && !d.jaComprou) {
        const q = query(collection(db, "usuarios"), where("meuCodigo", "==", d.quemMeIndicou));
        const querySnap = await getDocs(q);

        querySnap.forEach(async (docInd) => {
            await updateDoc(docInd.ref, { 
                saldoPontos: increment(1.00),
                indicacoesSemana: increment(1)
            });
        });
        await updateDoc(compradorRef, { jaComprou: true });
    }
}

// 5. MONITORAMENTO E INTERFACE
onAuthStateChanged(auth, (user) => {
    if (user) {
        const agora = new Date();
        const ultimoDia = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
        document.getElementById('area-resultado').innerText = `PRÓXIMO SORTEIO: ${ultimoDia.toLocaleDateString('pt-br')}`;

        onSnapshot(doc(db, "usuarios", user.uid), (s) => {
            const d = s.data();
            document.getElementById('user-display').innerText = d.nome;
            document.getElementById('meu-codigo-txt').innerText = d.meuCodigo;
            document.getElementById('saldo-pontos').innerText = d.saldoPontos.toFixed(2);
            document.getElementById('ponto-semana').innerText = d.indicacoesSemana || 0;
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('tela-rifa').classList.remove('hidden');
        });

        onSnapshot(doc(db, "config", "sorteio"), (snap) => {
            const d = snap.data() || { vendidos: 0, numerosComprados: [] };
            if (d.vendidos >= 50) document.getElementById('fase2-ui').classList.remove('locked');
            if (d.vendidos >= 100) document.getElementById('fase3-ui').classList.remove('locked');
            renderizarGrids(d.numerosComprados || []);
        });

        const qR = query(collection(db, "usuarios"), orderBy("indicacoesSemana", "desc"), limit(3));
        onSnapshot(qR, (snap) => {
            let h = "";
            snap.forEach(u => { h += `<p><span>${u.data().nome}</span> <b>${u.data().indicacoesSemana || 0} pts</b></p>`; });
            document.getElementById('ranking-lista').innerHTML = h;
        });
    }
});

// 6. GRIDS E PAGAMENTO
function renderizarGrids(comprados) {
    for (let f = 1; f <= 3; f++) {
        const grid = document.getElementById(`grid-fase${f}`);
        grid.innerHTML = "";
        for (let i = (f-1)*50+1; i <= f*50; i++) {
            const btn = document.createElement('button');
            btn.innerText = i;
            btn.className = comprados.includes(i) ? 'num comprado' : (selecionados.includes(i) ? 'num selecionado' : 'num');
            btn.onclick = () => {
                if (comprados.includes(i)) return;
                const idx = selecionados.indexOf(i);
                idx > -1 ? selecionados.splice(idx,1) : selecionados.push(i);
                renderizarGrids(comprados);
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
        document.getElementById('total-pagar').innerText = (selecionados.length * 7).toFixed(2);
    } else area.classList.add('hidden');
}

window.gerarPix = async () => {
    alert("PIX Copiado! Pague R$ " + (selecionados.length * 7).toFixed(2) + " para validar seus números.");
    // Aqui você chamaria pagarBonusIndicador(auth.currentUser.uid) após a confirmação do pagamento real
};

// 7. ARRASTE DE MOUSE (PC)
const slider = document.querySelector('.fases-wrapper');
let isDown = false; let startX; let scrollLeft;
slider.addEventListener('mousedown', (e) => { isDown = true; startX = e.pageX - slider.offsetLeft; scrollLeft = slider.scrollLeft; });
slider.addEventListener('mouseleave', () => isDown = false);
slider.addEventListener('mouseup', () => isDown = false);
slider.addEventListener('mousemove', (e) => {
    if(!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2;
    slider.scrollLeft = scrollLeft - walk;
});
