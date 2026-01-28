<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>RoboSorteio IA - Painel</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Rajdhani:wght@500;700&display=swap" rel="stylesheet">
</head>
<body>

    <div class="header">🤖 ROBOSORTEIO IA</div>

    <div class="container">
        
        <div class="slider">
            <div class="track">
                <div>🚀 IA v5.1 MONITORANDO SORTEIOS</div>
                <div>💎 SALDO ATUALIZADO EM TEMPO REAL</div>
                <div>🍀 INDIQUE AMIGOS E LIBERE FASES</div>
                <div>📊 SISTEMA DE RIFAS SEQUENCIAIS</div>
            </div>
        </div>

        <div class="card dashboard">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.9rem;">Bem-vindo, <b id="u-nome">...</b></span>
                <button onclick="window.location.href='config.html'" class="btn-settings">⚙️</button>
            </div>
            
            <div class="saldo">
                <small style="display:block; font-size: 0.6rem; color: var(--neon); letter-spacing: 2px;">SALDO DISPONÍVEL</small>
                R$ <span id="u-saldo">0.00</span>
            </div>

            <button onclick="window.location.href='central.html'" class="btn-outline" style="margin-bottom: 15px; border-color: #ffd700; color: #ffd700;">🎮 CENTRAL DE MINIGAMES</button>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button onclick="checkin()" class="btn-primary" style="font-size: 0.7rem; background: #1a1a1a; color: #fff; border: 1px solid #333;">📍 CHECK-IN (+0.01)</button>
                <button onclick="video()" id="btn-video" class="btn-primary" style="font-size: 0.7rem; background: #1a1a1a; color: #fff; border: 1px solid #333;">📺 VÍDEO (+0.02)</button>
            </div>
            
            <div id="video-timer" class="hidden" style="text-align:center; margin-top:10px; font-size: 0.7rem; color: var(--neon);">
                Sincronizando dados: <span id="timer">30</span>s...
            </div>
            
            <div class="stats" style="margin-top: 15px; border-top: 1px solid #222; padding-top: 10px;">
                <p>CÓDIGO: <span id="u-code" style="color: var(--neon);">...</span></p>
                <p>INDICAÇÕES: <span id="u-vendas" style="color: var(--neon);">0</span></p>
            </div>
        </div>

        <h4 style="font-family: 'Orbitron'; margin: 20px 0 10px 5px; font-size: 0.8rem; color: var(--neon); text-transform: uppercase;">🍀 Escolha seus Números</h4>
        
        <div class="fases-scroll">
            <div class="fase-card" id="fase-card-1">
                <div class="banner-lucro" style="background: var(--neon); position: relative; margin: -12px -12px 10px -12px; border-radius: 10px 10px 0 0;">FASE 1 - R$ 110,00</div>
                <div id="grid-1" class="grid"></div>
            </div>

            <div class="fase-card" id="fase-card-2">
                <div id="lock-2" class="lock-msg">
                    <span>🔒 FASE BLOQUEADA</span>
                    <small>REQUER 50 INDICAÇÕES</small>
                </div>
                <div class="banner-lucro" style="background: #333; position: relative; margin: -12px -12px 10px -12px; border-radius: 10px 10px 0 0;">FASE 2 - R$ 220,00</div>
                <div id="grid-2" class="grid"></div>
            </div>

            <div class="fase-card" id="fase-card-3">
                <div id="lock-3" class="lock-msg">
                    <span>🔒 FASE BLOQUEADA</span>
                    <small>REQUER 100 INDICAÇÕES</small>
                </div>
                <div class="banner-lucro" style="background: #333; position: relative; margin: -12px -12px 10px -12px; border-radius: 10px 10px 0 0;">FASE 3 - R$ 350,00</div>
                <div id="grid-3" class="grid"></div>
            </div>
        </div>

        <div class="regras">
            <h4 style="color: #888;">INSTRUÇÕES IA v5.1</h4>
            <p>• Selecione os números desejados em qualquer fase liberada.</p>
            <p>• O valor total é calculado automaticamente no checkout.</p>
            <p>• Pagamentos via PIX são processados instantaneamente.</p>
        </div>

        <div id="checkout" class="hidden">
            <div style="flex-grow: 1;">
                <p style="font-size: 0.6rem; color: #888; margin-bottom: 2px;">SELECIONADOS: <b id="sel-nums" style="color: var(--neon);">0</b></p>
                <p style="font-size: 1.1rem; font-weight: bold; color: var(--green);">R$ <span id="total-val">0.00</span></p>
            </div>
            <button onclick="pix()" class="btn-primary" style="width: auto; padding: 10px 25px; background: var(--green);">PAGAR PIX</button>
        </div>

    </div>

    <script src="app.js" type="module"></script>
</body>
</html>
