const express = require('express');
const cors = require('cors');
const app = express();

// Configurações iniciais do servidor
app.use(cors());
app.use(express.json());

// Rota principal de processamento do Robô
app.post('/gerar-pix', (req, res) => {
    try {
        const { nome, telefone, numeros, total } = req.body;

        // Limpeza do valor para evitar erro de cálculo matemático
        const totalLimpo = typeof total === 'string' 
            ? parseFloat(total.replace('R$ ', '').replace(',', '.')) 
            : parseFloat(total);

        // LOG DE ANÁLISE DO ROBÔ (Aparece no seu terminal)
        console.log("\n==========================================");
        console.log("🤖 ROBÔ ANALISTA ATIVO");
        console.log(`Cliente: ${nome || 'Não Identificado'}`);
        console.log(`Telefone: ${telefone || 'N/A'}`);
        console.log(`Números: ${numeros ? numeros.join(', ') : 'Nenhum'}`);
        console.log(`Valor Processado: R$ ${totalLimpo.toFixed(2)}`);
        console.log("STATUS: Transação autorizada com sucesso.");
        console.log("==========================================\n");

        // Resposta para o site (Aqui você pode colocar sua chave PIX real)
        res.json({
            status: "sucesso",
            copy_paste: "00020101021226850014BR.GOV.BCB.PIX0114SUACHAVEPIX25260530BR.com.mercadopago",
            msg: "Robô: Pagamento gerado!"
        });

    } catch (error) {
        console.log("❌ ERRO NO MOTOR DO ROBÔ:", error.message);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

// Inicialização do sistema
const PORT = process.env.PORT || 3000; 
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 MiniRifaProRobo Ativo na porta ${PORT}`);
});