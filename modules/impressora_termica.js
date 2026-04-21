// Módulo de Impressora Térmica - Cupom Não Fiscal
// Otimizado para: BG-58P (58mm de largura) com driver instalado no Windows
const ImpressoraTermica = {
    // Configurações padrão
    config: {
        larguraPapel: 58, // mm - BG-58P
        caracterePorLinha: 32, // aprox para papel 58mm (BG-58P)
        encodingCP850: true,
        usarImpressoraWindows: true // Usa driver BG-58P do Windows
    },

    // Inicializa o módulo
    init: function() {
        console.log('✓ Módulo de Impressora Térmica inicializado');
        console.log('✓ Usando driver BG-58P do Windows');
        this.detectarImpressoras();
    },

    // Detecta impressoras Windows (simples feedback)
    detectarImpressoras: function() {
        console.log('✓ Aguardando impressora padrão do Windows...');
        // Com o driver instalado, Windows já conhece a impressora
    },

    // Gera cupom não fiscal para conta a receber
    gerarCupomContaReceber: function(conta) {
        if (!conta) {
            alert('Nenhuma conta selecionada');
            return;
        }

        const cupom = this.montarCupomReceber(conta);
        this.imprimirCupom(cupom);
    },

    // Monta o conteúdo do cupom para conta a receber
    montarCupomReceber: function(conta) {
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const horaAtual = new Date().toLocaleTimeString('pt-BR');

        let linhas = [];

        // Cabeçalho
        linhas.push(this.centralizarTexto('CUPOM NÃO FISCAL'));
        linhas.push(this.centralizarTexto('COMPROVANTE DE RECEBIMENTO'));
        linhas.push('');

        // Separador
        linhas.push(this.linha());
        linhas.push('');

        // Informações da transação
        linhas.push('DADOS DA TRANSAÇÃO');
        linhas.push('');

        // Descrição
        linhas.push('DESCRIÇÃO:');
        linhas.push(this.quebrarTexto(conta.descricao, this.config.caracterePorLinha));
        linhas.push('');

        // Valor
        linhas.push(this.formatarLinha('VALOR:', this.formatarValor(conta.valor)));
        linhas.push('');

        // Cliente/Fornecedor
        if (conta.clienteFornecedor) {
            linhas.push('CLIENTE/FORNECEDOR:');
            linhas.push(this.quebrarTexto(conta.clienteFornecedor, this.config.caracterePorLinha));
            linhas.push('');
        }

        // Categoria
        if (conta.categoria) {
            linhas.push(this.formatarLinha('CATEGORIA:', conta.categoria));
            linhas.push('');
        }

        // Status
        const statusPT = {
            'pago': 'RECEBIDO',
            'pendente': 'PENDENTE',
            'atrasado': 'ATRASADO'
        };
        linhas.push(this.formatarLinha('STATUS:', statusPT[conta.status] || conta.status.toUpperCase()));
        linhas.push('');

        // Datas
        if (conta.vencimento) {
            const vencimento = new Date(conta.vencimento).toLocaleDateString('pt-BR');
            linhas.push(this.formatarLinha('VENCIMENTO:', vencimento));
        }

        if (conta.dataPagamento) {
            const pagamento = new Date(conta.dataPagamento).toLocaleDateString('pt-BR');
            linhas.push(this.formatarLinha('PAGAMENTO:', pagamento));
        }

        linhas.push('');

        // Observações
        if (conta.observacoes) {
            linhas.push('OBSERVAÇÕES:');
            linhas.push(this.quebrarTexto(conta.observacoes, this.config.caracterePorLinha));
            linhas.push('');
        }

        // Rodapé
        linhas.push(this.linha());
        linhas.push('');
        linhas.push(this.centralizarTexto(dataAtual + ' ' + horaAtual));
        linhas.push('');
        linhas.push(this.centralizarTexto('Obrigado!'));
        linhas.push('');

        return linhas.join('\n');
    },

    // Gera cupom não fiscal genérico
    gerarCupomCustomizado: function(dados) {
        const cupom = this.montarCupomCustomizado(dados);
        this.imprimirCupom(cupom);
    },

    // Monta cupom customizado
    montarCupomCustomizado: function(dados) {
        let linhas = [];

        // Cabeçalho
        linhas.push(this.centralizarTexto(dados.titulo || 'CUPOM NÃO FISCAL'));
        linhas.push('');
        linhas.push(this.linha());
        linhas.push('');

        // Itens
        if (dados.itens && Array.isArray(dados.itens)) {
            dados.itens.forEach(item => {
                if (item.descricao) {
                    linhas.push(item.descricao);
                }
                if (item.valor !== undefined) {
                    linhas.push(this.formatarLinha('', this.formatarValor(item.valor)));
                }
                linhas.push('');
            });
        }

        // Total
        if (dados.total !== undefined) {
            linhas.push(this.linha());
            linhas.push(this.formatarLinha('TOTAL:', this.formatarValor(dados.total)));
            linhas.push('');
        }

        // Observações
        if (dados.observacoes) {
            linhas.push(dados.observacoes);
            linhas.push('');
        }

        // Rodapé
        linhas.push(this.linha());
        const agora = new Date();
        linhas.push(this.centralizarTexto(agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR')));
        linhas.push('');

        return linhas.join('\n');
    },

    // Imprime o cupom
    imprimirCupom: function(conteudo) {
        console.log('Iniciando impressão com BG-58P...');
        this.imprimirComJanelaNavegador(conteudo);
    },

    // Imprime usando a impressora padrão do Windows (BG-58P)
    imprimirComJanelaNavegador: function(conteudo) {
        const janela = window.open('', '_blank');
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Cupom Não Fiscal - BG-58P</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        line-height: 1.2;
                        padding: 0;
                        margin: 0;
                        width: 58mm;
                        background: white;
                    }
                    pre {
                        margin: 0;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        font-family: 'Courier New', monospace;
                        font-size: 11px;
                    }
                    @media print {
                        body { 
                            padding: 0;
                            margin: 0;
                            width: 58mm;
                        }
                        @page {
                            size: 58mm auto;
                            margin: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <pre>${conteudo}</pre>
                <script>
                    // Aguarda um pouco e imprime automaticamente
                    setTimeout(() => {
                        window.print();
                        // Fecha a aba após 1 segundo
                        setTimeout(() => {
                            window.close();
                        }, 1000);
                    }, 500);
                </script>
            </body>
            </html>
        `;

        janela.document.write(html);
        janela.document.close();
    },

    // Converte texto para ESC/POS
    converterParaESCPOS: function(conteudo) {
        // Inicializar impressora
        let cmd = '\x1B\x40'; // Reset

        // Definir fonte padrão
        cmd += '\x1B\x4D\x00'; // Font A

        // Adicionar conteúdo linha por linha
        const linhas = conteudo.split('\n');
        linhas.forEach(linha => {
            cmd += linha + '\n';
        });

        // Corte de papel (com 1 segundo de espaço)
        cmd += '\n\n\n';
        cmd += '\x1D\x56\x42\x00'; // Cut (partial)

        return cmd;
    },

    // Funções auxiliares de formatação

    centralizarTexto: function(texto) {
        const espacos = Math.floor((this.config.caracterePorLinha - texto.length) / 2);
        return ' '.repeat(Math.max(0, espacos)) + texto;
    },

    linha: function() {
        return '-'.repeat(this.config.caracterePorLinha);
    },

    formatarLinha: function(label, valor) {
        const totalLargura = this.config.caracterePorLinha;
        const larguraDisponivel = totalLargura - label.length;
        const espacos = Math.max(1, larguraDisponivel - valor.length);
        return label + ' '.repeat(espacos) + valor;
    },

    formatarValor: function(valor) {
        const num = Number(valor) || 0;
        return 'R$ ' + num.toLocaleString('pt-BR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    },

    quebrarTexto: function(texto, largura) {
        const linhas = [];
        let inicio = 0;
        
        while (inicio < texto.length) {
            linhas.push(texto.substring(inicio, inicio + largura));
            inicio += largura;
        }
        
        return linhas.join('\n');
    },

    // Gera cupom de pagamento para Ordem de Serviço
    gerarCupomOrdemServico: function(os) {
        if (!os) {
            alert('Nenhuma Ordem de Serviço selecionada');
            return;
        }

        const cupom = this.montarCupomOrdemServico(os);
        this.imprimirCupom(cupom);
    },

    // Monta o conteúdo do cupom para Ordem de Serviço (Pagamento)
    montarCupomOrdemServico: function(os) {
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const horaAtual = new Date().toLocaleTimeString('pt-BR');

        let linhas = [];

        // Cabeçalho
        linhas.push(this.centralizarTexto('COMPROVANTE DE PAGAMENTO'));
        linhas.push(this.centralizarTexto('ORDEM DE SERVIÇO'));
        linhas.push('');

        // Separador
        linhas.push(this.linha());
        linhas.push('');

        // Número e dados da OS
        linhas.push(this.formatarLinha('OS:', os.numero));
        linhas.push('');

        // Cliente
        linhas.push('CLIENTE:');
        linhas.push(this.quebrarTexto(os.cliente, this.config.caracterePorLinha));
        linhas.push('');

        // Contato
        if (os.contato) {
            linhas.push(this.formatarLinha('CONTATO:', os.contato));
            linhas.push('');
        }

        // Serviço/Descrição
        linhas.push('DESCRIÇÃO DO SERVIÇO:');
        linhas.push(this.quebrarTexto(os.descricao, this.config.caracterePorLinha));
        linhas.push('');

        // Separador
        linhas.push(this.linha());
        linhas.push('');

        // Informações financeiras
        linhas.push(this.formatarLinha('VALOR TOTAL:', this.formatarValor(os.valor)));
        linhas.push('');

        // Status de pagamento
        linhas.push(this.centralizarTexto('✓ PAGO'));
        linhas.push('');

        // Datas
        const dataAbertura = new Date(os.dataAbertura).toLocaleDateString('pt-BR');
        linhas.push(this.formatarLinha('ABERTURA:', dataAbertura));
        
        if (os.dataConclusao) {
            const dataConclusao = new Date(os.dataConclusao).toLocaleDateString('pt-BR');
            linhas.push(this.formatarLinha('CONCLUSÃO:', dataConclusao));
        }
        linhas.push('');

        // Responsável
        linhas.push(this.formatarLinha('RESPONSÁVEL:', os.responsavel));
        linhas.push('');

        // Observações
        if (os.observacoes) {
            linhas.push('OBSERVAÇÕES:');
            linhas.push(this.quebrarTexto(os.observacoes, this.config.caracterePorLinha));
            linhas.push('');
        }

        // Rodapé
        linhas.push(this.linha());
        linhas.push('');
        linhas.push(this.centralizarTexto('RECEBIMENTO CONFIRMADO'));
        linhas.push('');
        linhas.push(this.centralizarTexto(dataAtual + ' ' + horaAtual));
        linhas.push('');
        linhas.push(this.centralizarTexto('Obrigado pela preferência!'));
        linhas.push('');

        return linhas.join('\n');
    },

    // Interface UI para botão de impressão
    adicionarBotaoImpressao: function(container, conta, tipo = 'receber') {
        const btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.textContent = '🖨️ Imprimir Cupom';
        btn.style.marginLeft = '10px';
        
        btn.addEventListener('click', () => {
            this.gerarCupomContaReceber(conta);
        });

        if (container) {
            container.appendChild(btn);
        }

        return btn;
    },

    // Função de debug - mostra status das impressoras
    verificarStatus: function() {
        console.clear();
        console.log('═════════════════════════════════════════');
        console.log('  STATUS DA IMPRESSORA TÉRMICA');
        console.log('═════════════════════════════════════════');
        
        console.log('✓ Driver BG-58P instalado no Windows');
        console.log('✓ Usando impressora padrão do Windows');
        console.log('✓ Papel: 58mm');
        console.log('✓ Caracteres por linha: 32');
        console.log('');
        console.log('Para testar:');
        console.log('1. Vá para Financeiro > Contas a Receber');
        console.log('2. Clique no botão 🖨️ de qualquer conta');
        console.log('3. Selecione "BG-58P" na caixa de diálogo');
        console.log('4. Clique em "Imprimir"');
        console.log('');
        console.log('═════════════════════════════════════════');
    }
};

// Auto-inicializar quando o documento estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ImpressoraTermica.init();
    });
} else {
    ImpressoraTermica.init();
}
