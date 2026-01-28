const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 1. ROTA DE PIX (Compra Avulsa)
app.post('/gerar-pix', (req, res) => {
    try {
        const { nome, numeros, total } = req.body;
        console.log(`\n💰 PIX SOLICITADO: ${nome} | Qtd: ${numeros.length}`);
        
        res.json({
            status: "sucesso",
            copy_paste: "00020101021226850014BR.GOV.BCB.PIX0114SUACHAVEPIX25260530BR.com.mercadopago", // Coloque sua chave PIX aqui
            msg: "Robô: PIX Gerado!"
        });
    } catch (e) {
        res.status(500).json({ error: "Erro no processamento do PIX." });
    }
});

// 2. ROTA DE CARTÃO (Plano Mensal Recurrente)
app.post('/assinar-plano', (req, res) => {
    try {
        const { nome, email, cartao, valorPlano } = req.body;
        
        // Simulação de Integração com Gateway (Stripe/MercadoPago)
        console.log(`\n💎 NOVA ASSINATURA MENSAL: ${nome}`);
        console.log(`Cartão: **** **** **** ${cartao.numero.slice(-4)}`);
        console.log(`Recorrência Ativa: R$ ${valorPlano}/mês com 20% OFF`);

        res.json({
            status: "sucesso",
            msg: "Assinatura confirmada! Seus números mensais foram liberados."
        });
    } catch (e) {
        res.status(500).json({ error: "Erro ao processar cartão de crédito." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 Robô Pro Ativo na Porta ${PORT}`);
});
