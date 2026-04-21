# 🖨️ Guia de Impressora Térmica - Cupom Não Fiscal

## Como Usar

### 1️⃣ Configuração Inicial

#### Opção A: Com qz-tray (Recomendado)
O qz-tray é uma aplicação que permite comunicação direta com impressoras locais.

**Passos:**
1. Baixe o qz-tray em: https://qz.io/download/
2. Instale a aplicação
3. Execute o qz-tray (ficará em segundo plano)
4. O sistema detectará automaticamente

#### Opção B: Sem qz-tray
O sistema usará a impressão padrão do navegador (qualquer impressora).

### 2️⃣ Como Imprimir Cupom

#### Contas a Receber
1. Vá para **Financeiro** → **Contas a Receber**
2. Clique no botão 🖨️ ao lado de qualquer conta
3. Escolha a impressora (se não tiver qz-tray)
4. Confirme

#### Programaticamente
```javascript
// Imprimir cupom de uma conta
const conta = {
    descricao: "Venda de Produtos",
    valor: 150.00,
    clienteFornecedor: "João Silva",
    categoria: "Vendas",
    status: "pago",
    vencimento: "2026-04-20",
    dataPagamento: "2026-04-19",
    observacoes: "Pagamento recebido"
};

ImpressoraTermica.gerarCupomContaReceber(conta);
```

### 3️⃣ Formatos Suportados

#### 🖨️ Impressora Térmica BG-58P
- **Papel:** 58mm de largura
- **Caracteres:** 32 caracteres por linha
- **Protocolo:** ESC/POS ✓
- **Velocidade:** Até 150mm/seg
- **Corte:** Automático de papel
- **Interface:** USB/Serial

### 4️⃣ Personalizar Cupom

#### Cupom Customizado
```javascript
const dados = {
    titulo: "VENDA",
    itens: [
        { descricao: "Produto A", valor: 100.00 },
        { descricao: "Produto B", valor: 50.00 }
    ],
    total: 150.00,
    observacoes: "Obrigado pela compra!"
};

ImpressoraTermica.gerarCupomCustomizado(dados);
```

### 5️⃣ Troubleshooting

#### "qz-tray não está carregado"
- Verifique se a aplicação qz-tray está em execução
- Abra https://qz.io no navegador para verificar o status

#### "Nenhuma impressora detectada"
- Verifique se a impressora está conectada
- Reinicie o qz-tray
- Configure uma impressora padrão no Windows/Mac/Linux

#### "Erro ao imprimir"
- Verifique se a impressora está online
- Verifique se há papel na impressora
- Veja o console do navegador (F12) para mais detalhes

### 6️⃣ Configurações Avançadas

Edite o arquivo `modules/impressora_termica.js`:

```javascript
config: {
    larguraPapel: 80,        // 58mm, 80mm, 110mm
    caracterePorLinha: 42,   // Ajuste conforme necessário
    encodingCP850: true      // Use false para UTF-8
}
```

### 7️⃣ Impressoras Recomendadas

- **Elgin Termica** (Bematech)
- **Sweda SV-100**
- **Star Micronics**
- **Epson TM Series**
- Qualquer impressora USB/Rede com suporte ESC/POS

---

## Recursos

- ✅ Impressão direta em impressora térmica
- ✅ Formatação automática para papel térmico
- ✅ Suporte a ESC/POS
- ✅ Fallback para impressão do navegador
- ✅ Cupons personalizáveis
- ✅ Integração com contas a receber

## Tecnologia

- **qz-tray**: Comunicação com impressoras
- **ESC/POS**: Protocolo de impressora térmica
- **Highcharts**: Visualização de dados
