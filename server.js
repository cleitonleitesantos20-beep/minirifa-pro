const express = require('express');
const cors = require('cors');
const app = express();

// Configurações essenciais de segurança e leitura de dados
app.use(cors());
app.use(express.json());

// Rota para o Robô Processar o PIX
app.post('/gerar-pix', (req, res) => {
    try {
        const { nome, telefone, numeros, total } = req.body;

        // Limpeza do valor para cálculo (Remove "R$ " e troca vírgula por ponto)
        const totalLimpo = typeof total === 'string' 
            ? parseFloat(total.replace('R$ ', '').replace('.', '').replace(',', '.')) 
            : parseFloat(total);

        // LOG DE ANÁLISE DO ROBÔ (Aparece no painel do Render)
        console.log("\n==========================================");
        console.log("🤖 ROBÔ ANALISTA ATIVO");
        console.log(`Cliente: ${nome || 'Não Identificado'}`);
        console.log(`Telefone: ${telefone || 'N/A'}`);
        console.log(`Números Escolhidos: ${numeros ? numeros.join(', ') : 'Nenhum'}`);
        console.log(`Valor Processado: R$ ${totalLimpo.toFixed(2)}`);
        console.log("STATUS: Transação autorizada.");
        console.log("==========================================\n");

        // Resposta enviada de volta para o seu site
        res.json({
            status: "sucesso",
            copy_paste: "00020101021226850014BR.GOV.BCB.PIX0114SUACHAVEPIX25260530BR.com.mercadopago", // Substitua pela sua chave real
            msg: "Robô: Pagamento gerado com sucesso!"
        });

    } catch (error) {
        console.log("❌ ERRO NO MOTOR DO ROBÔ:", error.message);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

// Porta dinâmica para o Render (Ele usa a 10000 por padrão)
const PORT = process.env.PORT || 10000; 
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 MiniRifaProRobo Ativo na porta ${PORT}`);
});
