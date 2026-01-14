// Módulo Financeiro
const FinanceiroModule = {
    charts: {},
    _initialized: false,
    
    // Formata valor numérico para o padrão brasileiro
    formatarValor: function(valor) {
        if(!valor && valor !== 0) return 'R$ 0,00';
        const num = parseFloat(valor);
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    },
    
    init: function() {
        if(!this._initialized) {
            this.bindEvents();
            this._initialized = true;
        }
        // Garante que Chart.js esteja carregado antes de inicializar gráficos
        if(typeof IzakGestao !== 'undefined' && IzakGestao.ensureChart) {
            IzakGestao.ensureChart(() => {
                this.loadCharts();
                this.updateFinanceDashboard();
            });
        } else {
            this.loadCharts();
            this.updateFinanceDashboard();
        }
        this.renderContasReceber();
        this.renderContasPagar();
        this.updateCaixaStatus();
        this.renderMovimentacoes();
        this.calcularFluxoCaixa();
    },
    
    bindEvents: function() {
        // Tabs do módulo
        document.querySelectorAll('.module-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchFinanceTab(e.target.getAttribute('data-finance-tab'));
            });
        });
        
        // Contas a Receber - clona para remover listeners antigos
        const addReceberBtn = document.getElementById('add-conta-receber-btn');
        if(addReceberBtn) {
            const newBtn = addReceberBtn.cloneNode(true);
            addReceberBtn.parentNode.replaceChild(newBtn, addReceberBtn);
            newBtn.addEventListener('click', () => {
                this.showContaModal('receber');
            });
        }
        
        document.getElementById('search-receber').addEventListener('input', (e) => {
            this.filterContasReceber(e.target.value);
        });
        
        document.getElementById('filter-status-receber').addEventListener('change', (e) => {
            this.filterContasReceberByStatus(e.target.value);
        });
        
        document.getElementById('filter-mes-receber').addEventListener('change', (e) => {
            this.filterContasReceberByMes(e.target.value);
        });
        
        // Contas a Pagar - clona para remover listeners antigos
        const addPagarBtn = document.getElementById('add-conta-pagar-btn');
        if(addPagarBtn) {
            const newBtn = addPagarBtn.cloneNode(true);
            addPagarBtn.parentNode.replaceChild(newBtn, addPagarBtn);
            newBtn.addEventListener('click', () => {
                this.showContaModal('pagar');
            });
        }
        
        document.getElementById('search-pagar').addEventListener('input', (e) => {
            this.filterContasPagar(e.target.value);
        });
        
        document.getElementById('filter-status-pagar').addEventListener('change', (e) => {
            this.filterContasPagarByStatus(e.target.value);
        });
        
        document.getElementById('filter-mes-pagar').addEventListener('change', (e) => {
            this.filterContasPagarByMes(e.target.value);
        });
        
        // Caixa
        document.getElementById('abrir-caixa-btn').addEventListener('click', () => {
            this.abrirCaixa();
        });
        
        document.getElementById('fechar-caixa-btn').addEventListener('click', () => {
            this.fecharCaixa();
        });
        
        document.getElementById('add-movimentacao-btn').addEventListener('click', () => {
            this.showMovimentacaoModal();
        });
        
        // Modal de Conta - remove e recria o elemento para limpar listeners antigos
        const contaForm = document.getElementById('conta-form');
        if(contaForm) {
            const newForm = contaForm.cloneNode(true);
            contaForm.parentNode.replaceChild(newForm, contaForm);
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveConta();
            });
        }
        
        const cancelBtn = document.getElementById('cancel-conta-btn');
        if(cancelBtn) {
            const newBtn = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newBtn, cancelBtn);
            newBtn.addEventListener('click', () => {
                this.hideContaModal();
            });
        }
        
        // Modal de Movimentação
        const movForm = document.getElementById('movimentacao-form');
        const cancelMovBtn = document.getElementById('cancel-mov-btn');
        
        if(movForm) {
            movForm.removeEventListener('submit', this._movFormHandler);
            this._movFormHandler = (e) => {
                e.preventDefault();
                this.saveMovimentacao();
            };
            movForm.addEventListener('submit', this._movFormHandler);
        }
        
        if(cancelMovBtn) {
            console.log('Botão cancel-mov-btn encontrado, adicionando listener');
            cancelMovBtn.removeEventListener('click', this._cancelMovHandler);
            this._cancelMovHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Botão cancelar clicado, fechando modal');
                this.hideMovimentacaoModal();
            };
            cancelMovBtn.addEventListener('click', this._cancelMovHandler);
        } else {
            console.error('Botão cancel-mov-btn NÃO encontrado');
        }
        
        // Fluxo de Caixa
        document.getElementById('periodo-fluxo').addEventListener('change', (e) => {
            if(e.target.value === 'custom') {
                document.getElementById('custom-periodo').classList.remove('hidden');
            } else {
                document.getElementById('custom-periodo').classList.add('hidden');
                this.calcularFluxoCaixa(parseInt(e.target.value));
            }
        });
        
        // Fechar modais ao clicar fora
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if(e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    },
    
    switchFinanceTab: function(tabName) {
        // Atualiza botões das tabs
        document.querySelectorAll('.module-tab').forEach(tab => {
            tab.classList.remove('active');
            if(tab.getAttribute('data-finance-tab') === tabName) {
                tab.classList.add('active');
            }
        });
        
        // Atualiza conteúdo das tabs
        document.querySelectorAll('.finance-tab-content').forEach(content => {
            content.classList.remove('active');
            if(content.id === `finance-${tabName}`) {
                content.classList.add('active');
            }
        });
        
        // Carrega dados específicos da tab
        if(tabName === 'dashboard') {
            this.updateFinanceDashboard();
        } else if(tabName === 'receber') {
            this.renderContasReceber();
        } else if(tabName === 'pagar') {
            this.renderContasPagar();
        } else if(tabName === 'caixa') {
            this.updateCaixaStatus();
            this.renderMovimentacoes();
        } else if(tabName === 'fluxo') {
            this.calcularFluxoCaixa();
        }
    },
    
    loadCharts: function() {
        // Inicializa os gráficos se o Chart.js estiver disponível
        if(typeof Chart !== 'undefined') {
            this.initCharts();
        } else {
            console.warn('Chart.js ainda não está disponível para o módulo Financeiro');
        }
    },
    
    initCharts: function() {
        // Gráfico de Receitas x Despesas
        const ctx1 = document.getElementById('receita-despesa-chart');
        if(ctx1) {
            this.charts.receitaDespesa = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Receitas',
                        data: [],
                        backgroundColor: 'rgba(39, 174, 96, 0.7)',
                        borderColor: 'rgba(39, 174, 96, 1)',
                        borderWidth: 1
                    }, {
                        label: 'Despesas',
                        data: [],
                        backgroundColor: 'rgba(231, 76, 60, 0.7)',
                        borderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        // Gráfico de Status
        const ctx2 = document.getElementById('status-chart');
        if(ctx2) {
            this.charts.status = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['Pago', 'Pendente', 'Atrasado'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: [
                            'rgba(39, 174, 96, 0.7)',
                            'rgba(243, 156, 18, 0.7)',
                            'rgba(231, 76, 60, 0.7)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true
                }
            });
        }
        
        // Gráfico de Fluxo de Caixa
        const ctx3 = document.getElementById('fluxo-caixa-chart');
        if(ctx3) {
            this.charts.fluxoCaixa = new Chart(ctx3, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Saldo Acumulado',
                        data: [],
                        borderColor: 'rgba(0, 85, 164, 1)',
                        backgroundColor: 'rgba(0, 85, 164, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    },
    
    updateFinanceDashboard: function() {
        // Calcula totais
        const hoje = new Date().toISOString().split('T')[0];
        
        // Contas a Receber
        const totalReceber = IzakGestao.data.financeiro.contasReceber
            .filter(cr => cr.status !== 'pago')
            .reduce((sum, cr) => sum + cr.valor, 0);
        
        const receberHoje = IzakGestao.data.financeiro.contasReceber
            .filter(cr => cr.vencimento === hoje && cr.status === 'pendente').length;
        
        // Contas a Pagar
        const totalPagar = IzakGestao.data.financeiro.contasPagar
            .filter(cp => cp.status !== 'pago')
            .reduce((sum, cp) => sum + cp.valor, 0);
        
        const pagarHoje = IzakGestao.data.financeiro.contasPagar
            .filter(cp => cp.vencimento === hoje && cp.status === 'pendente').length;
        
        // Saldo previsto (30 dias)
        const saldoPrevisto = this.calcularSaldoPrevisto(30);
        
        // Saldo do caixa
        const caixa = IzakGestao.data.financeiro.caixa;
        const caixaAtual = caixa.length > 0 ? caixa[caixa.length - 1].saldoFinal : 0;
        
        // Calcula lucro do mês
        const lucroMes = this.calcularLucroMes();
        
        // Atualiza a interface
        document.getElementById('total-receber').textContent = this.formatarValor(totalReceber);
        document.getElementById('contas-receber-hoje').textContent = receberHoje;
        document.getElementById('total-pagar').textContent = this.formatarValor(totalPagar);
        document.getElementById('contas-pagar-hoje').textContent = pagarHoje;
        document.getElementById('saldo-previsto').textContent = this.formatarValor(saldoPrevisto);
        document.getElementById('saldo-caixa').textContent = this.formatarValor(caixaAtual);
        document.getElementById('lucro-mes').textContent = this.formatarValor(lucroMes);
        
        // Atualiza cor do lucro
        const lucroElement = document.getElementById('lucro-mes');
        if(lucroMes >= 0) {
            lucroElement.className = 'valor-positivo';
        } else {
            lucroElement.className = 'valor-negativo';
        }
        
        // Atualiza gráficos
        this.updateCharts();
        
        // Atualiza alertas
        this.updateAlertas();
    },
    
    updateCharts: function() {
        if(!this.charts.receitaDespesa || !this.charts.status) return;
        
        // Últimos 6 meses
        const meses = [];
        const receitas = [];
        const despesas = [];
        
        const hoje = new Date();
        for(let i = 5; i >= 0; i--) {
            const mes = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const mesStr = mes.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            meses.push(mesStr);
            
            // Calcula receitas e despesas do mês
            const { receita, despesa } = this.calcularReceitasDespesasMes(mes);
            receitas.push(receita);
            despesas.push(despesa);
        }
        
        // Atualiza gráfico de receitas x despesas
        this.charts.receitaDespesa.data.labels = meses;
        this.charts.receitaDespesa.data.datasets[0].data = receitas;
        this.charts.receitaDespesa.data.datasets[1].data = despesas;
        this.charts.receitaDespesa.update();
        
        // Calcula status das contas
        const contas = [...IzakGestao.data.financeiro.contasReceber, ...IzakGestao.data.financeiro.contasPagar];
        const pago = contas.filter(c => c.status === 'pago').length;
        const pendente = contas.filter(c => c.status === 'pendente').length;
        const atrasado = contas.filter(c => c.status === 'atrasado').length;
        
        // Atualiza gráfico de status
        this.charts.status.data.datasets[0].data = [pago, pendente, atrasado];
        this.charts.status.update();
    },
    
    calcularReceitasDespesasMes: function(data) {
        const mes = data.getMonth();
        const ano = data.getFullYear();
        
        let receita = 0;
        let despesa = 0;
        
        // Contas a receber pagas no mês
        IzakGestao.data.financeiro.contasReceber.forEach(cr => {
            if(cr.status === 'pago' && cr.dataPagamento) {
                const dataPagamento = new Date(cr.dataPagamento);
                if(dataPagamento.getMonth() === mes && dataPagamento.getFullYear() === ano) {
                    receita += cr.valor;
                }
            }
        });
        
        // Contas a pagar pagas no mês
        IzakGestao.data.financeiro.contasPagar.forEach(cp => {
            if(cp.status === 'pago' && cp.dataPagamento) {
                const dataPagamento = new Date(cp.dataPagamento);
                if(dataPagamento.getMonth() === mes && dataPagamento.getFullYear() === ano) {
                    despesa += cp.valor;
                }
            }
        });
        
        // Movimentações de caixa do mês
        IzakGestao.data.financeiro.caixa.forEach(c => {
            c.movimentacoes.forEach(mov => {
                const dataMov = new Date(mov.data);
                if(dataMov.getMonth() === mes && dataMov.getFullYear() === ano) {
                    if(mov.tipo === 'entrada') {
                        receita += mov.valor;
                    } else {
                        despesa += mov.valor;
                    }
                }
            });
        });
        
        return { receita, despesa };
    },
    
    updateAlertas: function() {
        const container = document.getElementById('alertas-container');
        if(!container) return;
        
        container.innerHTML = '';
        
        const hoje = new Date();
        const alertas = [];
        
        // Contas a receber vencendo hoje
        IzakGestao.data.financeiro.contasReceber.forEach(cr => {
            if(cr.status === 'pendente') {
                const vencimento = new Date(cr.vencimento);
                const diffDias = Math.floor((vencimento - hoje) / (1000 * 60 * 60 * 24));
                
                if(diffDias === 0) {
                    alertas.push({
                        tipo: 'receber',
                        descricao: cr.descricao,
                        valor: cr.valor,
                        data: cr.vencimento,
                        status: 'hoje'
                    });
                } else if(diffDias < 0) {
                    alertas.push({
                        tipo: 'receber',
                        descricao: cr.descricao,
                        valor: cr.valor,
                        data: cr.vencimento,
                        status: 'atrasado'
                    });
                } else if(diffDias <= 3) {
                    alertas.push({
                        tipo: 'receber',
                        descricao: cr.descricao,
                        valor: cr.valor,
                        data: cr.vencimento,
                        status: 'futuro'
                    });
                }
            }
        });
        
        // Contas a pagar vencendo hoje
        IzakGestao.data.financeiro.contasPagar.forEach(cp => {
            if(cp.status === 'pendente') {
                const vencimento = new Date(cp.vencimento);
                const diffDias = Math.floor((vencimento - hoje) / (1000 * 60 * 60 * 24));
                
                if(diffDias === 0) {
                    alertas.push({
                        tipo: 'pagar',
                        descricao: cp.descricao,
                        valor: cp.valor,
                        data: cp.vencimento,
                        status: 'hoje'
                    });
                } else if(diffDias < 0) {
                    alertas.push({
                        tipo: 'pagar',
                        descricao: cp.descricao,
                        valor: cp.valor,
                        data: cp.vencimento,
                        status: 'atrasado'
                    });
                } else if(diffDias <= 3) {
                    alertas.push({
                        tipo: 'pagar',
                        descricao: cp.descricao,
                        valor: cp.valor,
                        data: cp.vencimento,
                        status: 'futuro'
                    });
                }
            }
        });
        
        // Ordena por data e status
        alertas.sort((a, b) => {
            if(a.status === 'atrasado' && b.status !== 'atrasado') return -1;
            if(a.status !== 'atrasado' && b.status === 'atrasado') return 1;
            return new Date(a.data) - new Date(b.data);
        });
        
        // Limita a 10 alertas
        const alertasExibir = alertas.slice(0, 10);
        
        if(alertasExibir.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhum alerta no momento.</p>';
            return;
        }
        
        alertasExibir.forEach(alerta => {
            const alertaElement = document.createElement('div');
            alertaElement.className = `alerta-item ${alerta.status}`;
            
            const tipo = alerta.tipo === 'receber' ? 'A Receber' : 'A Pagar';
            const dataFormatada = new Date(alerta.data).toLocaleDateString('pt-BR');
            
            alertaElement.innerHTML = `
                <div class="alerta-info">
                    <div class="alerta-descricao">${alerta.descricao} (${tipo})</div>
                    <div class="alerta-data">Vencimento: ${dataFormatada}</div>
                </div>
                <div class="alerta-valor ${alerta.tipo === 'receber' ? 'valor-positivo' : 'valor-negativo'}">
                    ${this.formatarValor(alerta.valor)}
                </div>
            `;
            
            container.appendChild(alertaElement);
        });
    },
    
    calcularSaldoPrevisto: function(dias) {
        const hoje = new Date();
        const dataFim = new Date(hoje);
        dataFim.setDate(dataFim.getDate() + dias);
        
        let saldo = 0;
        
        // Adiciona contas a receber no período
        IzakGestao.data.financeiro.contasReceber.forEach(cr => {
            if(cr.status !== 'pago') {
                const vencimento = new Date(cr.vencimento);
                if(vencimento <= dataFim) {
                    saldo += cr.valor;
                }
            }
        });
        
        // Subtrai contas a pagar no período
        IzakGestao.data.financeiro.contasPagar.forEach(cp => {
            if(cp.status !== 'pago') {
                const vencimento = new Date(cp.vencimento);
                if(vencimento <= dataFim) {
                    saldo -= cp.valor;
                }
            }
        });
        
        return saldo;
    },
    
    calcularLucroMes: function() {
        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();
        
        let receita = 0;
        let custo = 0;
        
        // Calcula receitas do mês a partir de contas a receber pagas
        IzakGestao.data.financeiro.contasReceber.forEach(cr => {
            if(cr.status === 'pago' && cr.dataPagamento) {
                const dataPagamento = new Date(cr.dataPagamento);
                if(dataPagamento.getMonth() === mesAtual && dataPagamento.getFullYear() === anoAtual) {
                    receita += cr.valor;
                }
            }
        });
        
        // Calcula custo do mês a partir do estoque vendido
        if(IzakGestao.data.estoque && IzakGestao.data.estoque.length > 0) {
            // Verifica se há um registro de vendas ou usa valor do estoque
            // Por enquanto, calcula baseado em contas a receber que estão no estoque
            IzakGestao.data.contasReceber && IzakGestao.data.financeiro.contasReceber.forEach(cr => {
                if(cr.status === 'pago' && cr.dataPagamento) {
                    const dataPagamento = new Date(cr.dataPagamento);
                    if(dataPagamento.getMonth() === mesAtual && dataPagamento.getFullYear() === anoAtual) {
                        // Tenta encontrar o item no estoque para calcular custo
                        const item = IzakGestao.data.estoque.find(e => 
                            e.nome && cr.descricao && cr.descricao.toLowerCase().includes(e.nome.toLowerCase())
                        );
                        if(item && item.custo) {
                            // Estima quantidade vendida pela descrição ou usa valor aproximado
                            custo += item.custo;
                        }
                    }
                }
            });
        }
        
        // Calcula custo também a partir de contas a pagar (fornecedores)
        IzakGestao.data.financeiro.contasPagar.forEach(cp => {
            if(cp.status === 'pago' && cp.dataPagamento && cp.categoria && 
               (cp.categoria.toLowerCase().includes('compra') || 
                cp.categoria.toLowerCase().includes('insumo') ||
                cp.categoria.toLowerCase().includes('matéria') ||
                cp.categoria.toLowerCase().includes('fornecedor'))) {
                const dataPagamento = new Date(cp.dataPagamento);
                if(dataPagamento.getMonth() === mesAtual && dataPagamento.getFullYear() === anoAtual) {
                    custo += cp.valor;
                }
            }
        });
        
        const lucro = receita - custo;
        return lucro;
    },
    
    // Métodos para Contas a Receber
    showContaModal: function(tipo, conta = null) {
        const modal = document.getElementById('conta-modal');
        const title = document.getElementById('modal-title');
        
        document.getElementById('conta-form').reset();
        document.getElementById('conta-tipo').value = tipo;
        
        if(conta) {
            // Modo edição
            title.textContent = `Editar Conta ${tipo === 'receber' ? 'a Receber' : 'a Pagar'}`;
            document.getElementById('conta-id').value = conta.id;
            document.getElementById('conta-descricao').value = conta.descricao;
            document.getElementById('conta-categoria').value = conta.categoria;
            document.getElementById('conta-valor').value = conta.valor;
            document.getElementById('conta-vencimento').value = conta.vencimento;
            document.getElementById('conta-pagamento').value = conta.dataPagamento || '';
            document.getElementById('conta-cliente').value = conta.clienteFornecedor || '';
            document.getElementById('conta-status').value = conta.status;
            document.getElementById('conta-observacoes').value = conta.observacoes || '';
        } else {
            // Modo criação
            title.textContent = `Nova Conta ${tipo === 'receber' ? 'a Receber' : 'a Pagar'}`;
            document.getElementById('conta-id').value = '';
            document.getElementById('conta-vencimento').value = new Date().toISOString().split('T')[0];
        }
        
        modal.classList.remove('hidden');
    },
    
    hideContaModal: function() {
        document.getElementById('conta-modal').classList.add('hidden');
    },
    
    saveConta: function() {
        // Previne múltiplas submissões
        if(this._savingConta) {
            console.log('Já está salvando uma conta, ignorando duplicação');
            return;
        }
        this._savingConta = true;
        
        const form = document.getElementById('conta-form');
        const tipo = document.getElementById('conta-tipo').value;
        const contaId = document.getElementById('conta-id').value;
        
        const conta = {
            id: contaId || Date.now().toString(),
            descricao: document.getElementById('conta-descricao').value,
            categoria: document.getElementById('conta-categoria').value,
            valor: parseFloat(document.getElementById('conta-valor').value),
            vencimento: document.getElementById('conta-vencimento').value,
            dataPagamento: document.getElementById('conta-pagamento').value || null,
            clienteFornecedor: document.getElementById('conta-cliente').value || '',
            status: document.getElementById('conta-status').value,
            observacoes: document.getElementById('conta-observacoes').value || '',
            dataCriacao: contaId ? this.getContaDataCriacao(tipo, contaId) : new Date().toISOString(),
            dataAtualizacao: new Date().toISOString()
        };
        
        // Atualiza status baseado na data de pagamento
        if(conta.dataPagamento) {
            conta.status = 'pago';
        } else {
            const vencimento = new Date(conta.vencimento);
            const hoje = new Date();
            if(vencimento < hoje && conta.status === 'pendente') {
                conta.status = 'atrasado';
            }
        }
        
        // Adiciona ou atualiza a conta
        const array = tipo === 'receber' ? 
            IzakGestao.data.financeiro.contasReceber : 
            IzakGestao.data.financeiro.contasPagar;
        
        const index = array.findIndex(c => c.id === conta.id);
        if(index >= 0) {
            array[index] = conta;
        } else {
            array.push(conta);
        }
        
        // Se a conta foi marcada como pago, registra automaticamente no caixa
        if(conta.status === 'pago' && conta.dataPagamento) {
            this.registrarMovimentacaoCaixa(tipo, conta);
        }
        
        IzakGestao.saveData();
        
        // Atualiza a interface
        if(tipo === 'receber') {
            this.renderContasReceber();
        } else {
            this.renderContasPagar();
        }
        
        this.updateFinanceDashboard();
        if (typeof IzakGestao !== 'undefined' && IzakGestao.updateDashboard) {
            IzakGestao.updateDashboard();
        }
        this.hideContaModal();
        
        // Libera a flag após um pequeno delay
        setTimeout(() => {
            this._savingConta = false;
        }, 300);
    },
    
    getContaDataCriacao: function(tipo, id) {
        const array = tipo === 'receber' ? 
            IzakGestao.data.financeiro.contasReceber : 
            IzakGestao.data.financeiro.contasPagar;
        
        const conta = array.find(c => c.id === id);
        return conta ? conta.dataCriacao : new Date().toISOString();
    },
    
    registrarMovimentacaoCaixa: function(tipo, conta) {
        const caixa = IzakGestao.data.financeiro.caixa;
        
        // Se não há caixa aberto, cria um automático para hoje
        let caixaAtual = null;
        if(caixa.length > 0 && caixa[caixa.length - 1].fechamento === null) {
            caixaAtual = caixa[caixa.length - 1];
        } else {
            // Se não há caixa aberto, avisa ao usuário
            console.log('Nenhum caixa aberto. Movimentação não será registrada no caixa.');
            alert('Atenção: Nenhum caixa aberto. Abra um caixa para registrar a movimentação.');
            return;
        }
        
        // Verifica se já existe uma movimentação para esta conta
        const movJaExiste = caixaAtual.movimentacoes.some(mov => mov.contaId === conta.id);
        if(movJaExiste) {
            console.log('Movimentação desta conta já foi registrada no caixa');
            return;
        }
        
        // Cria a movimentação
        const movimentacao = {
            id: Date.now().toString(),
            contaId: conta.id,
            tipo: tipo === 'receber' ? 'entrada' : 'saida',
            categoria: conta.categoria,
            valor: conta.valor,
            data: conta.dataPagamento,
            descricao: `${tipo === 'receber' ? 'Recebimento' : 'Pagamento'}: ${conta.descricao}`,
            formaPagamento: 'não informado',
            observacoes: `Conta de ${tipo} - ${conta.clienteFornecedor}`,
            automatica: true
        };
        
        // Atualiza saldo do caixa
        if(movimentacao.tipo === 'entrada') {
            caixaAtual.saldoFinal += movimentacao.valor;
        } else {
            caixaAtual.saldoFinal -= movimentacao.valor;
        }
        
        caixaAtual.movimentacoes.push(movimentacao);
        console.log(`Movimentação registrada automaticamente no caixa: ${movimentacao.descricao}`);
    },
    
    renderContasReceber: function() {
        const container = document.getElementById('contas-receber-list');
        if(!container) return;
        
        container.innerHTML = '';
        
        const contas = [...IzakGestao.data.financeiro.contasReceber]
            .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));
        
        if(contas.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhuma conta a receber cadastrada.</p>';
            return;
        }
        
        contas.forEach(conta => {
            const contaElement = this.createContaElement(conta, 'receber');
            container.appendChild(contaElement);
        });
    },
    
    renderContasPagar: function() {
        const container = document.getElementById('contas-pagar-list');
        if(!container) return;
        
        container.innerHTML = '';
        
        const contas = [...IzakGestao.data.financeiro.contasPagar]
            .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));
        
        if(contas.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhuma conta a pagar cadastrada.</p>';
            return;
        }
        
        contas.forEach(conta => {
            const contaElement = this.createContaElement(conta, 'pagar');
            container.appendChild(contaElement);
        });
    },
    
    createContaElement: function(conta, tipo) {
        const element = document.createElement('div');
        element.className = `conta-item ${tipo} ${conta.status}`;
        
        // Converte datas corretamente (formato YYYY-MM-DD para data local)
        const formatarData = (dataStr) => {
            if (!dataStr) return '--/--/----';
            const [ano, mes, dia] = dataStr.split('-');
            return `${dia}/${mes}/${ano}`;
        };
        
        const dataVencimento = formatarData(conta.vencimento);
        const dataPagamento = formatarData(conta.dataPagamento);
        
        element.innerHTML = `
            <div class="conta-info">
                <h4>${conta.descricao}</h4>
                <p class="conta-categoria">${conta.categoria || 'Sem categoria'}</p>
                <p class="conta-cliente">${conta.clienteFornecedor || 'Não informado'}</p>
            </div>
            <div class="conta-valor">
                ${this.formatarValor(conta.valor)}
            </div>
            <div class="conta-data">
                <span class="conta-data-label">Vencimento</span>
                <span class="conta-data-valor">${dataVencimento}</span>
            </div>
            <div class="conta-data">
                <span class="conta-data-label">Pagamento</span>
                <span class="conta-data-valor">${dataPagamento}</span>
            </div>
                        <div class="conta-actions">
                                <span class="conta-status status-${conta.status}">${conta.status}</span>
                                <button class="btn-edit" data-id="${conta.id}" data-tipo="${tipo}">Editar</button>
                                <button class="btn-delete" data-id="${conta.id}" data-tipo="${tipo}">Excluir</button>
                                ${tipo === 'receber' ? `
                                    ${conta?.boleto?.id ? `
                                        <button class="btn-secondary" data-action="boleto-pdf" data-id="${conta.id}">PDF</button>
                                        <button class="btn-secondary" data-action="boleto-linha" data-id="${conta.id}">Linha</button>
                                        ${conta.boleto.status !== 'pago' ? `<button class="btn-secondary" data-action="boleto-cancel" data-id="${conta.id}">Cancelar Boleto</button>` : ''}
                                    ` : `
                                        ${conta.status !== 'pago' ? `<button class="btn-primary" data-action="boleto-emit" data-id="${conta.id}">Emitir Boleto</button>` : ''}
                                    `}
                                ` : ''}
                        </div>
        `;
        
        // Adiciona eventos
        element.querySelector('.btn-edit').addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const tipo = e.target.getAttribute('data-tipo');
            const contaArray = tipo === 'receber' ? 
                IzakGestao.data.financeiro.contasReceber : 
                IzakGestao.data.financeiro.contasPagar;
            const conta = contaArray.find(c => c.id === id);
            this.showContaModal(tipo, conta);
        });
        
        element.querySelector('.btn-delete').addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const tipo = e.target.getAttribute('data-tipo');
            if(confirm('Tem certeza que deseja excluir esta conta?')) {
                this.deleteConta(id, tipo);
            }
        });

        // Ações de boleto (contas a receber)
        if (tipo === 'receber') {
            const emitBtn = element.querySelector('[data-action="boleto-emit"]');
            const pdfBtn = element.querySelector('[data-action="boleto-pdf"]');
            const linhaBtn = element.querySelector('[data-action="boleto-linha"]');
            const cancelBtn = element.querySelector('[data-action="boleto-cancel"]');

            if (emitBtn) {
                emitBtn.addEventListener('click', async () => {
                    try {
                        await this.emitirBoletoParaConta(conta);
                        alert('Boleto emitido com sucesso!');
                        this.renderContasReceber();
                    } catch (err) {
                        alert('Falha ao emitir boleto: ' + (err?.message || err));
                    }
                });
            }
            if (pdfBtn) {
                pdfBtn.addEventListener('click', () => {
                    const url = conta?.boleto?.pdfUrl;
                    if (url) window.open(url, '_blank');
                });
            }
            if (linhaBtn) {
                linhaBtn.addEventListener('click', async () => {
                    const linha = conta?.boleto?.linhaDigitavel;
                    if (!linha) return;
                    try { await navigator.clipboard.writeText(linha); alert('Linha digitável copiada!'); } catch {}
                });
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', async () => {
                    if (!conta?.boleto?.id) return;
                    if (!confirm('Cancelar este boleto?')) return;
                    try {
                        const res = await BoletoService.cancelar(conta.boleto.id);
                        conta.boleto = { ...conta.boleto, status: res.status };
                        // Persistir
                        const idx = IzakGestao.data.financeiro.contasReceber.findIndex(c => c.id === conta.id);
                        if (idx >= 0) IzakGestao.data.financeiro.contasReceber[idx] = conta;
                        IzakGestao.saveData();
                        this.renderContasReceber();
                    } catch (err) {
                        alert('Falha ao cancelar: ' + (err?.message || err));
                    }
                });
            }
        }
        
        return element;
    },

    // Localiza cliente por nome para montar pagador
    _findClienteByName: function(nome) {
        const list = IzakGestao?.data?.clientes || [];
        const normalized = (nome || '').toLowerCase();
        return list.find(c => (c.nome || '').toLowerCase() === normalized) || null;
    },

    emitirBoletoParaConta: async function(conta) {
        // Coleta dados do pagador a partir do nome da conta
        const cliente = this._findClienteByName(conta.clienteFornecedor);
        if (!cliente || !cliente.documento) {
            throw new Error('Cliente não encontrado ou sem CPF/CNPJ. Atualize os dados do cliente.');
        }
        const pagador = {
            nome: cliente.nome,
            documento: (cliente.documento || '').replace(/\D/g, ''),
            email: cliente?.contato?.email || '',
            telefone: cliente?.contato?.telefone || cliente?.contato?.celular || '',
            endereco: cliente?.endereco || {}
        };

        const instrucoes = 'Não receber após 30 dias. Juros 1% a.m.';
        const referencia = conta.descricao ? `FIN-${conta.descricao}` : `FIN-${conta.id}`;

        const boleto = await BoletoService.emitir({
            valor: conta.valor,
            vencimento: conta.vencimento,
            pagador,
            instrucoes,
            referencia
        });

        // Anexa dados do boleto à conta e persiste
        conta.boleto = {
            id: boleto.id,
            status: boleto.status,
            linhaDigitavel: boleto.linhaDigitavel,
            pdfUrl: boleto.pdfUrl,
            provider: boleto.provider,
            emitidoEm: boleto.createdAt
        };
        const idx = IzakGestao.data.financeiro.contasReceber.findIndex(c => c.id === conta.id);
        if (idx >= 0) IzakGestao.data.financeiro.contasReceber[idx] = conta;
        IzakGestao.saveData();
    },
    
    deleteConta: function(id, tipo) {
        const array = tipo === 'receber' ? 
            IzakGestao.data.financeiro.contasReceber : 
            IzakGestao.data.financeiro.contasPagar;
        
        IzakGestao.data.financeiro[tipo === 'receber' ? 'contasReceber' : 'contasPagar'] = 
            array.filter(c => c.id !== id);
        
        IzakGestao.saveData();
        
        if(tipo === 'receber') {
            this.renderContasReceber();
        } else {
            this.renderContasPagar();
        }
        
        this.updateFinanceDashboard();
        if (typeof IzakGestao !== 'undefined' && IzakGestao.updateDashboard) {
            IzakGestao.updateDashboard();
        }
    },
    
    // Métodos de filtro
    filterContasReceber: function(searchTerm) {
        this.filterContas('receber', searchTerm);
    },
    
    filterContasPagar: function(searchTerm) {
        this.filterContas('pagar', searchTerm);
    },
    
    filterContas: function(tipo, searchTerm) {
        const container = document.getElementById(`contas-${tipo}-list`);
        if(!container) return;
        
        const contas = container.querySelectorAll('.conta-item');
        const term = searchTerm.toLowerCase();
        
        contas.forEach(conta => {
            const descricao = conta.querySelector('.conta-info h4').textContent.toLowerCase();
            const categoria = conta.querySelector('.conta-categoria').textContent.toLowerCase();
            const cliente = conta.querySelector('.conta-cliente').textContent.toLowerCase();
            
            if(descricao.includes(term) || categoria.includes(term) || cliente.includes(term)) {
                conta.style.display = '';
            } else {
                conta.style.display = 'none';
            }
        });
    },
    
    filterContasReceberByStatus: function(status) {
        this.filterContasByStatus('receber', status);
    },
    
    filterContasPagarByStatus: function(status) {
        this.filterContasByStatus('pagar', status);
    },
    
    filterContasByStatus: function(tipo, status) {
        const container = document.getElementById(`contas-${tipo}-list`);
        if(!container) return;
        
        const contas = container.querySelectorAll('.conta-item');
        
        if(!status) {
            contas.forEach(conta => {
                conta.style.display = '';
            });
            return;
        }
        
        contas.forEach(conta => {
            if(conta.classList.contains(status)) {
                conta.style.display = '';
            } else {
                conta.style.display = 'none';
            }
        });
    },
    
    filterContasReceberByMes: function(mes) {
        this.filterContasByMes('receber', mes);
    },
    
    filterContasPagarByMes: function(mes) {
        this.filterContasByMes('pagar', mes);
    },
    
    filterContasByMes: function(tipo, mes) {
        const container = document.getElementById(`contas-${tipo}-list`);
        if(!container || !mes) return;
        
        const contas = container.querySelectorAll('.conta-item');
        const [ano, mesNum] = mes.split('-').map(Number);
        
        contas.forEach(conta => {
            const dataElement = conta.querySelector('.conta-data-valor');
            if(!dataElement) {
                conta.style.display = 'none';
                return;
            }
            
            const dataTexto = dataElement.textContent;
            const [dia, mesData, anoData] = dataTexto.split('/').map(Number);
            
            if(mesData === mesNum && anoData === ano) {
                conta.style.display = '';
            } else {
                conta.style.display = 'none';
            }
        });
    },
    
    // Métodos para Controle de Caixa
    updateCaixaStatus: function() {
        const caixa = IzakGestao.data.financeiro.caixa;
        const caixaAberto = caixa.length > 0 && caixa[caixa.length - 1].fechamento === null;
        
        if(caixaAberto) {
            const ultimoCaixa = caixa[caixa.length - 1];
            document.getElementById('caixa-status-text').textContent = 'Aberto';
            document.getElementById('caixa-status-text').style.color = 'var(--success-color)';
            document.getElementById('caixa-saldo-atual').textContent = `Saldo: ${this.formatarValor(ultimoCaixa.saldoFinal)}`;
            document.getElementById('caixa-abertura').textContent = 
                `Abertura: ${new Date(ultimoCaixa.abertura).toLocaleDateString('pt-BR')}`;
            
            // Calcula entradas e saídas do dia
            this.calcularResumoDia(ultimoCaixa);
        } else {
            document.getElementById('caixa-status-text').textContent = 'Fechado';
            document.getElementById('caixa-status-text').style.color = 'var(--danger-color)';
            document.getElementById('caixa-saldo-atual').textContent = `Saldo: ${this.formatarValor(0)}`;
            document.getElementById('caixa-abertura').textContent = 'Última abertura: --/--/----';
            document.getElementById('entradas-dia').textContent = this.formatarValor(0);
            document.getElementById('saidas-dia').textContent = this.formatarValor(0);
            document.getElementById('saldo-dia').textContent = this.formatarValor(0);
        }
    },
    
    calcularResumoDia: function(caixa) {
        const hoje = new Date().toISOString().split('T')[0];
        let entradas = 0;
        let saidas = 0;
        
        caixa.movimentacoes.forEach(mov => {
            const dataMov = new Date(mov.data).toISOString().split('T')[0];
            if(dataMov === hoje) {
                if(mov.tipo === 'entrada') {
                    entradas += mov.valor;
                } else {
                    saidas += mov.valor;
                }
            }
        });
        
        const saldoDia = entradas - saidas;
        
        document.getElementById('entradas-dia').textContent = this.formatarValor(entradas);
        document.getElementById('saidas-dia').textContent = this.formatarValor(saidas);
        document.getElementById('saldo-dia').textContent = this.formatarValor(saldoDia);
        
        if(saldoDia >= 0) {
            document.getElementById('saldo-dia').className = 'valor-saldo';
        } else {
            document.getElementById('saldo-dia').className = 'valor-negativo';
        }
    },
    
    abrirCaixa: function() {
        const caixa = IzakGestao.data.financeiro.caixa;
        
        // Verifica se já existe um caixa aberto
        if(caixa.length > 0 && caixa[caixa.length - 1].fechamento === null) {
            alert('Já existe um caixa aberto!');
            return;
        }
        
        const saldoInicial = prompt('Digite o saldo inicial do caixa:', '0.00');
        if(saldoInicial === null) return;
        
        const novoCaixa = {
            id: Date.now().toString(),
            abertura: new Date().toISOString(),
            saldoInicial: parseFloat(saldoInicial) || 0,
            saldoFinal: parseFloat(saldoInicial) || 0,
            fechamento: null,
            movimentacoes: []
        };
        
        caixa.push(novoCaixa);
        IzakGestao.saveData();
        this.updateCaixaStatus();
        this.renderMovimentacoes();
        
        alert('Caixa aberto com sucesso!');
    },
    
    fecharCaixa: function() {
        const caixa = IzakGestao.data.financeiro.caixa;
        if(caixa.length === 0 || caixa[caixa.length - 1].fechamento !== null) {
            alert('Não há caixa aberto para fechar!');
            return;
        }
        
        const saldoFinal = prompt('Digite o saldo final do caixa:', 
            caixa[caixa.length - 1].saldoFinal.toString());
        if(saldoFinal === null) return;
        
        const ultimoCaixa = caixa[caixa.length - 1];
        ultimoCaixa.saldoFinal = parseFloat(saldoFinal) || 0;
        ultimoCaixa.fechamento = new Date().toISOString();
        
        IzakGestao.saveData();
        this.updateCaixaStatus();
        
        // Gera relatório de fechamento
        this.gerarRelatorioFechamento(ultimoCaixa);
    },
    
    gerarRelatorioFechamento: function(caixa) {
        const printWindow = window.open('', '_blank');
        const dataAbertura = new Date(caixa.abertura).toLocaleDateString('pt-BR');
        const dataFechamento = new Date(caixa.fechamento).toLocaleDateString('pt-BR');
        
        // Calcula totais
        let totalEntradas = 0;
        let totalSaidas = 0;
        
        caixa.movimentacoes.forEach(mov => {
            if(mov.tipo === 'entrada') {
                totalEntradas += mov.valor;
            } else {
                totalSaidas += mov.valor;
            }
        });
        
        const diferenca = caixa.saldoFinal - (caixa.saldoInicial + totalEntradas - totalSaidas);
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Fechamento de Caixa - ${dataFechamento}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #0055A4; }
                    .info { margin-bottom: 20px; }
                    .info p { margin: 5px 0; }
                    .resumo { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .resumo-item { display: flex; justify-content: space-between; margin-bottom: 10px; }
                    .resumo-item.total { font-weight: bold; border-top: 2px solid #ddd; padding-top: 10px; }
                    .movimentacoes-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .movimentacoes-table th, .movimentacoes-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .movimentacoes-table th { background-color: #f2f2f2; }
                    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Izak Comunicação Visual</h1>
                    <h2>Fechamento de Caixa</h2>
                </div>
                
                <div class="info">
                    <p><strong>Data de Abertura:</strong> ${dataAbertura}</p>
                    <p><strong>Data de Fechamento:</strong> ${dataFechamento}</p>
                    <p><strong>Responsável:</strong> Admin</p>
                </div>
                
                <div class="resumo">
                    <div class="resumo-item">
                        <span>Saldo Inicial:</span>
                        <span>${this.formatarValor(caixa.saldoInicial)}</span>
                    </div>
                    <div class="resumo-item">
                        <span>Total de Entradas:</span>
                        <span style="color: #27ae60;">${this.formatarValor(totalEntradas)}</span>
                    </div>
                    <div class="resumo-item">
                        <span>Total de Saídas:</span>
                        <span style="color: #e74c3c;">${this.formatarValor(totalSaidas)}</span>
                    </div>
                    <div class="resumo-item">
                        <span>Saldo Esperado:</span>
                        <span>${this.formatarValor(caixa.saldoInicial + totalEntradas - totalSaidas)}</span>
                    </div>
                    <div class="resumo-item">
                        <span>Saldo Final Informado:</span>
                        <span>${this.formatarValor(caixa.saldoFinal)}</span>
                    </div>
                    <div class="resumo-item total">
                        <span>Diferença:</span>
                        <span style="${diferenca >= 0 ? 'color: #27ae60;' : 'color: #e74c3c;'}">
                            ${this.formatarValor(diferenca)} ${diferenca >= 0 ? '(Sobra)' : '(Falta)'}
                        </span>
                    </div>
                </div>
                
                <h3>Movimentações do Dia</h3>
                <table class="movimentacoes-table">
                    <thead>
                        <tr>
                            <th>Hora</th>
                            <th>Descrição</th>
                            <th>Tipo</th>
                            <th>Valor</th>
                            <th>Forma de Pagamento</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${caixa.movimentacoes.map(mov => {
                            const data = new Date(mov.data);
                            const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            return `
                                <tr>
                                    <td>${hora}</td>
                                    <td>${mov.descricao}</td>
                                    <td>${mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td>
                                    <td>${this.formatarValor(mov.valor)}</td>
                                    <td>${mov.formaPagamento}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>Izak Comunicação Visual - Sistema de Gestão</p>
                    <p>Relatório gerado automaticamente pelo sistema</p>
                </div>
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    },
    
    showMovimentacaoModal: function() {
        const modal = document.getElementById('movimentacao-modal');
        document.getElementById('movimentacao-form').reset();
        document.getElementById('mov-data').value = new Date().toISOString().slice(0, 16);
        modal.classList.remove('hidden');
    },
    
    hideMovimentacaoModal: function() {
        console.log('hideMovimentacaoModal chamado');
        const modal = document.getElementById('movimentacao-modal');
        if(modal) {
            console.log('Modal encontrado, adicionando classe hidden');
            modal.classList.add('hidden');
        } else {
            console.error('Modal movimentacao-modal não encontrado');
        }
    },
    
    saveMovimentacao: function() {
        const caixa = IzakGestao.data.financeiro.caixa;
        if(caixa.length === 0 || caixa[caixa.length - 1].fechamento !== null) {
            alert('Não há caixa aberto para registrar movimentação!');
            this.hideMovimentacaoModal();
            return;
        }
        
        const ultimoCaixa = caixa[caixa.length - 1];
        
        const movimentacao = {
            id: Date.now().toString(),
            tipo: document.getElementById('mov-tipo').value,
            categoria: document.getElementById('mov-categoria').value,
            valor: parseFloat(document.getElementById('mov-valor').value),
            data: document.getElementById('mov-data').value,
            descricao: document.getElementById('mov-descricao').value,
            formaPagamento: document.getElementById('mov-forma-pagamento').value,
            observacoes: document.getElementById('mov-observacoes').value
        };
        
        // Atualiza saldo do caixa
        if(movimentacao.tipo === 'entrada') {
            ultimoCaixa.saldoFinal += movimentacao.valor;
        } else {
            ultimoCaixa.saldoFinal -= movimentacao.valor;
        }
        
        ultimoCaixa.movimentacoes.push(movimentacao);
        IzakGestao.saveData();
        
        this.updateCaixaStatus();
        this.renderMovimentacoes();
        this.hideMovimentacaoModal();
        
        alert('Movimentação registrada com sucesso!');
    },
    
    renderMovimentacoes: function() {
        const container = document.getElementById('movimentacoes-list');
        if(!container) return;
        
        container.innerHTML = '';
        
        const caixa = IzakGestao.data.financeiro.caixa;
        if(caixa.length === 0 || caixa[caixa.length - 1].fechamento !== null) {
            container.innerHTML = '<p class="empty-message">Não há caixa aberto.</p>';
            return;
        }
        
        const movimentacoes = caixa[caixa.length - 1].movimentacoes
            .sort((a, b) => new Date(b.data) - new Date(a.data));
        
        if(movimentacoes.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhuma movimentação registrada.</p>';
            return;
        }
        
        movimentacoes.forEach(mov => {
            const movElement = document.createElement('div');
            movElement.className = `movimentacao-item ${mov.tipo}`;
            
            const data = new Date(mov.data);
            const dataFormatada = data.toLocaleDateString('pt-BR');
            const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            movElement.innerHTML = `
                <div class="mov-tipo ${mov.tipo}">${mov.tipo === 'entrada' ? 'E' : 'S'}</div>
                <div class="mov-descricao">
                    <h4>${mov.descricao}</h4>
                    <p class="mov-categoria">${mov.categoria}</p>
                </div>
                <div class="mov-data">${dataFormatada}<br>${horaFormatada}</div>
                <div class="mov-forma-pagamento">${mov.formaPagamento}</div>
                <div class="mov-valor ${mov.tipo}">${this.formatarValor(mov.valor)}</div>
                <div class="mov-observacoes">${mov.observacoes || ''}</div>
            `;
            
            container.appendChild(movElement);
        });
    },
    
    // Métodos para Fluxo de Caixa
    calcularFluxoCaixa: function(dias = 30) {
        if(!this.charts.fluxoCaixa) return;
        
        const hoje = new Date();
        const dataFim = new Date(hoje);
        dataFim.setDate(dataFim.getDate() + dias);
        
        // Agrupa por dia
        const fluxoPorDia = {};
        let dataAtual = new Date(hoje);
        
        // Inicializa todos os dias
        while(dataAtual <= dataFim) {
            const dataStr = dataAtual.toISOString().split('T')[0];
            fluxoPorDia[dataStr] = {
                data: new Date(dataAtual),
                entradas: 0,
                saidas: 0,
                saldo: 0
            };
            dataAtual.setDate(dataAtual.getDate() + 1);
        }
        
        // Adiciona contas a receber
        IzakGestao.data.financeiro.contasReceber.forEach(cr => {
            if(cr.status !== 'pago') {
                const dataStr = cr.vencimento;
                if(fluxoPorDia[dataStr]) {
                    fluxoPorDia[dataStr].entradas += cr.valor;
                }
            }
        });
        
        // Adiciona contas a pagar
        IzakGestao.data.financeiro.contasPagar.forEach(cp => {
            if(cp.status !== 'pago') {
                const dataStr = cp.vencimento;
                if(fluxoPorDia[dataStr]) {
                    fluxoPorDia[dataStr].saidas += cp.valor;
                }
            }
        });
        
        // Converte para arrays e calcula saldo acumulado
        const diasArray = Object.values(fluxoPorDia).sort((a, b) => a.data - b.data);
        const labels = [];
        const saldos = [];
        let saldoAcumulado = 0;
        
        diasArray.forEach(dia => {
            const saldoDia = dia.entradas - dia.saidas;
            saldoAcumulado += saldoDia;
            
            labels.push(dia.data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));
            saldos.push(saldoAcumulado);
            
            dia.saldo = saldoDia;
        });
        
        // Atualiza gráfico
        this.charts.fluxoCaixa.data.labels = labels;
        this.charts.fluxoCaixa.data.datasets[0].data = saldos;
        this.charts.fluxoCaixa.update();
        
        // Atualiza detalhes
        this.renderDetalhesFluxo(diasArray);
    },
    
    renderDetalhesFluxo: function(diasArray) {
        const container = document.getElementById('fluxo-detalhes-content');
        if(!container) return;
        
        container.innerHTML = '';
        
        if(diasArray.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhum dado para o período selecionado.</p>';
            return;
        }
        
        diasArray.forEach(dia => {
            if(dia.entradas === 0 && dia.saidas === 0) return;
            
            const diaElement = document.createElement('div');
            diaElement.className = 'dia-fluxo';
            
            const dataFormatada = dia.data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
            const saldoDia = dia.entradas - dia.saidas;
            const saldoClass = saldoDia >= 0 ? 'dia-fluxo-positivo' : 'dia-fluxo-negativo';
            
            diaElement.innerHTML = `
                <div class="dia-fluxo-header">
                    <span class="dia-fluxo-data">${dataFormatada}</span>
                    <span class="dia-fluxo-total ${saldoClass}">
                        ${this.formatarValor(saldoDia)}
                    </span>
                </div>
                <div class="dia-fluxo-itens">
                    ${dia.entradas > 0 ? `
                        <div class="dia-fluxo-item">
                            <span>Entradas:</span>
                            <span class="valor-positivo">${this.formatarValor(dia.entradas)}</span>
                        </div>
                    ` : ''}
                    ${dia.saidas > 0 ? `
                        <div class="dia-fluxo-item">
                            <span>Saídas:</span>
                            <span class="valor-negativo">${this.formatarValor(dia.saidas)}</span>
                        </div>
                    ` : ''}
                </div>
            `;
            
            container.appendChild(diaElement);
        });
    }
};