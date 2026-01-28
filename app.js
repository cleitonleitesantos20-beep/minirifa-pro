<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>RoboSorteio - IA Autônoma</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Rajdhani:wght@500;700&display=swap" rel="stylesheet">
</head>
<body>

    <div class="header">🤖 ROBOSORTEIO IA</div>

    <div class="container">
        <div id="auth-screen">
            <div class="card">
                <div class="banner-lucro">🚀 GANHE ATÉ <b>R$ 345,00/MÊS</b></div>
                <h2>ACESSO</h2>
                <input type="email" id="email" placeholder="E-mail">
                <input type="password" id="senha" placeholder="Senha">
                <button onclick="login()" class="btn-primary">ENTRAR</button>
                <div class="sep">OU</div>
                <input type="text" id="nome" placeholder="Seu Nome">
                <input type="text" id="ref" placeholder="Código de Indicação (Opcional)">
                <button onclick="cadastrar()" class="btn-outline">CRIAR CONTA</button>
            </div>
        </div>

        <div id="app-screen" class="hidden">
            
            <div class="slider">
                <div class="track">
                    <div>🚀 IA AUTÔNOMA ATIVA</div>
                    <div>💎 ACUMULE SALDO DIÁRIO</div>
                    <div>⚡ SORTEIOS EM BREVE</div>
                    <div>🍀 INDIQUE E GANHE</div>
                </div>
            </div>

            <div class="card dashboard">
                <div class="top-row">
                    <span>Olá, <b id="u-nome">...</b></span>
                    <button onclick="sair()" class="btn-small">SAIR</button>
                </div>
                <div class="saldo">R$ <span id="u-saldo">0.00</span></div>
                <div class="actions">
                    <button onclick="checkin()" id="btn-checkin">📍 CHECK-IN (+0.05)</button>
                    <button onclick="video()" id="btn-video">📺 VÍDEO (+0.10)</button>
                </div>
                <div id="video-timer" class="hidden">Aguarde <span id="timer">30</span>s...</div>
                <div class="stats">
                    <p>CÓDIGO: <span id="u-code">...</span></p>
                    <p>INDICAÇÕES: <span id="u-vendas">0</span></p>
                </div>
            </div>

            <div class="fases-scroll">
                <div class="fase-card" id="card-fase1">
                    <div class="badge">FASE 1 (R$ 100,00)</div>
                    <div id="grid-1" class="grid"></div>
                </div>
                
                <div class="fase-card" id="card-fase2">
                    <div class="lock-msg">🔒 50 INDICAÇÕES NECESSÁRIAS</div>
                    <div class="badge">FASE 2 (R$ 220,00)</div>
                    <div id="grid-2" class="grid"></div>
                </div>
                
                <div class="fase-card" id="card-fase3">
                    <div class="lock-msg">🔒 100 INDICAÇÕES NECESSÁRIAS</div>
                    <div class="badge">FASE 3 (R$ 330,00)</div>
                    <div id="grid-3" class="grid"></div>
                </div>
            </div>

            <div id="checkout" class="hidden card">
                <p>Selecionados: <span id="sel-nums" style="color:#00f2ff"></span></p>
                <h3>Total: R$ <span id="total-val">0.00</span></h3>
                <button onclick="pix()" class="btn-pix">PAGAR COM PIX</button>
            </div>

            <div class="card ranking">
                <h3>🏆 TOP INDICADORES</h3>
                <div id="rank-list">Carregando...</div>
            </div>
            
            <div class="regras">
                <h4>⚖️ REGRAS E FUNCIONAMENTO</h4>
                <p>• <b>Sistema:</b> Criado por um Robô com IA Autônoma.</p>
                <p>• <b>Ganhos:</b> Faça check-in e veja vídeos (1x ao dia cada) para acumular saldo.</p>
                <p>• <b>Valores:</b> Números da sorte custam R$ 7,00 cada.</p>
                <p>• <b>Saques:</b> No momento não há opção de saque, apenas acúmulo de saldo para uso interno.</p>
                <p>• <b>Indicação:</b> bônus ao indicar novos usuários.</p>
            </div>
        </div>
    </div>

    <script src="app.js" type="module"></script>
</body>
</html>
