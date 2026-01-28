const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/gerar-pix', (req, res) => {
    try {
        const { nome, numeros, total, planoMensal, indicação } = req.body;
        
        // Limpeza de valores para cálculo matemático
        let valorBase = typeof total === 'string' 
            ? parseFloat(total.replace('R$ ', '').replace('.', '').replace(',', '.')) 
            : parseFloat(total);

        // Lógica de Desconto do Plano Mensal (20% OFF)
        let valorFinal = planoMensal ? valorBase * 0.8 : valorBase;

        console.log("\n==========================================");
        console.log("🤖 ROBÔ ANALISTA ATIVO");
        console.log(`Cliente: ${nome}`);
        console.log(`Números: ${numeros.join(', ')}`);
        console.log(`Plano Mensal: ${planoMensal ? 'SIM (Desconto Aplicado)' : 'NÃO'}`);
        console.log(`Indicado por: ${indicação || 'Ninguém'}`);
        console.log(`VALOR FINAL COBRADO: R$ ${valorFinal.toFixed(2)}`);
        console.log("==========================================\n");

        res.json({
            status: "sucesso",
            copy_paste: "00020101021226850014BR.GOV.BCB.PIX...", // Sua chave PIX aqui
            valorAtualizado: valorFinal.toFixed(2)
        });
    } catch (error) {
        res.status(500).json({ error: "Erro no motor do robô." });
    }
});

const PORT = process.env.PORT || 10000; // Porta padrão do Render
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 Robô Pro Ativo na porta ${PORT}`);
});
