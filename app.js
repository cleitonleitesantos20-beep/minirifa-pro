import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, increment, collection, query, orderBy, limit, getDoc, setDoc, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

// ==========================================
// 2. FUNÇÕES DE ACESSO (LOGIN / CADASTRO / SAIR)
// ==========================================

window.login = async () => {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    if (!email || !senha) return alert("Por favor, preencha o e-mail e a senha.");
    
    try {
        await signInWithEmailAndPassword(auth, email, senha);
    } catch (err) {
        alert("Erro ao entrar: Verifique seus dados.");
    }
};

window.cadastrar = async () => {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const ref = document.getElementById('ref-code').value;

    if (!nome || !email || !senha) return alert("Preencha todos os campos para cadastro!");

    try {
        const res = await createUserWithEmailAndPassword(auth, email, senha);
        const meuCod = nome.substring(0,3).toUpperCase() + Math.floor(1000 + Math.random()*9000);
        
        await setDoc(doc(db, "usuarios", res.user.uid), { 
            nome: nome, 
            meuCodigo: meuCod, 
            saldoPontos: 0, 
            indicacoesSemana: 0, 
            quemMeIndicou: ref || null, 
            jaComprou: false,
            ultimoCheckin: ""
        });
        alert("Conta criada com sucesso!");
    } catch (err) {
        alert("Erro no cadastro: " + err.message);
    }
};

window.sair = () => {
    signOut(auth).then(() => {
        location.reload();
    }).catch((error) => {
        alert("Erro ao sair.");
    });
};

// ==========================================
// 3. MONITORAMENTO DE ESTADO E DADOS
// ==========================================

onAuthStateChanged(auth, (user) => {
    const areaLogin = document.getElementById('auth-section');
    const areaApp = document.getElementById('tela-rifa');

    if (user) {
        areaLogin.classList.add('hidden');
        areaApp.classList.remove('hidden');
        
        // Monitorar dados do usuário Logado
        onSnapshot(doc(db, "usuarios", user.uid), (s) => {
            const d = s.data();
            if (d) {
                document.getElementById('user-display').innerText = d.nome;
                document.getElementById('meu-codigo-txt').innerText = d.meuCodigo;
                document.getElementById('saldo-pontos').innerText = d.saldoPontos.toFixed(2);
                document.getElementById('ponto-semana').innerText = d.indicacoesSemana || 0;
            }
        });

        // Monitorar Sorteio e Fases
        onSnapshot(doc(db, "config", "sorteio"), (snap) => {
            const d = snap.data() || { vendidos: 0, numerosComprados: [] };
            
            // Lógica de desbloqueio de fases
            if (d.vendidos >= 50) document.getElementById('fase2-ui').classList.remove('locked');
            if (d.vendidos >= 100) document.getElementById('fase3-ui').classList.remove('locked');
            
            renderizarGrids(d.numerosComprados || []);
            
            const agora = new Date();
            const ultimoDia = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
            document.getElementById('area-resultado').innerText = `📅 PRÓXIMO SORTEIO: ${ultimoDia.toLocaleDateString('pt-br')}`;
        });

        // Ranking
        const qRanking = query(collection(db, "usuarios"), orderBy("indicacoesSemana", "desc"), limit(3));
        onSnapshot(qRanking, (snap) => {
            let html = "";
            snap.forEach(u => {
                html += `<p><span>${u.data().nome}</span> <b>${u.data().indicacoesSemana || 0} pts</b></p>`;
            });
            document.getElementById('ranking-lista').innerHTML = html;
        });

    } else {
        areaLogin.classList.remove('hidden');
        areaApp.classList.add('hidden');
    }
});

// ==========================================
// 4. LÓGICA DE GANHOS (CHECK-IN E VÍDEO)
// ==========================================

window.fazerCheckin = async () => {
    const user = auth.currentUser;
    const uRef = doc(db, "usuarios", user.uid);
    const snap = await getDoc(uRef);
    const hoje = new Date().toLocaleDateString();

    if (snap.data().ultimoCheckin === hoje) return alert("📍 Você já fez o check-in hoje!");

    await updateDoc(uRef, { 
        ultimoCheckin: hoje, 
        saldoPontos: increment(0.05) 
    });
    alert("✅ Bônus de R$ 0,05 adicionado!");
};

window.assistirPropaganda = () => {
    const btn = document.getElementById('btn-video');
    const timerArea = document.getElementById('timer-video');
    const segs = document.getElementById('segundos');
    let tempo = 30;

    btn.classList.add('hidden');
    timerArea.classList.remove('hidden');

    const contador = setInterval(async () => {
        tempo--;
        segs.innerText = tempo;

        if (tempo <= 0) {
            clearInterval(contador);
            await updateDoc(doc(db, "usuarios", auth.currentUser.uid), { 
                saldoPontos: increment(0.10) 
            });
            timerArea.classList.add('hidden');
            btn.classList.remove('hidden');
            alert("📺 Parabéns! Você ganhou R$ 0,10.");
        }
    }, 1000);
};

// ==========================================
// 5. LÓGICA DE RIFAS E COMPRA
// ==========================================

function renderizarGrids(comprados) {
    for (let f = 1; f <= 3; f++) {
        const grid = document.getElementById(`grid-fase${f}`);
        if (!grid) continue;
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
        document.getElementById('total-pagar').innerText = (selecionados.length * PRECO_UNITARIO).toFixed(2);
    } else {
        area.classList.add('hidden');
    }
}

window.gerarPix = () => {
    const valor = (selecionados.length * PRECO_UNITARIO).toFixed(2);
    alert(`💠 PIX COPIADO!\n\nValor: R$ ${valor}\n\nApós o pagamento, envie o comprovante no suporte para liberar seus números.`);
};

// ==========================================
// 6. INTERATIVIDADE: ARRASTE DE MOUSE (PC)
// ==========================================

const slider = document.querySelector('.fases-wrapper');
let isDown = false;
let startX;
let scrollLeft;

slider.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
    slider.style.cursor = 'grabbing';
});
slider.addEventListener('mouseleave', () => {
    isDown = false;
    slider.style.cursor = 'grab';
});
slider.addEventListener('mouseup', () => {
    isDown = false;
    slider.style.cursor = 'grab';
});
slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2; 
    slider.scrollLeft = scrollLeft - walk;
});
