// Objeto principal do aplicativo
const IzakGestao = {
    defaultData: function() {
        return {
            orcamentos: [],
            ordensServico: [],
            clientes: [],
            estoque: [],
            financeiro: {
                contasReceber: [],
                contasPagar: [],
                caixa: []
            }
        };
    },

    normalizeData: function(data) {
        const base = this.defaultData();
        const src = data && typeof data === 'object' ? data : {};

        base.orcamentos = Array.isArray(src.orcamentos) ? src.orcamentos : [];
        base.ordensServico = Array.isArray(src.ordensServico) ? src.ordensServico : [];
        base.clientes = Array.isArray(src.clientes) ? src.clientes : [];
        base.estoque = Array.isArray(src.estoque) ? src.estoque : [];

        const financeiro = src.financeiro && typeof src.financeiro === 'object' ? src.financeiro : {};
        base.financeiro = {
            contasReceber: Array.isArray(financeiro.contasReceber) ? financeiro.contasReceber : [],
            contasPagar: Array.isArray(financeiro.contasPagar) ? financeiro.contasPagar : [],
            caixa: Array.isArray(financeiro.caixa) ? financeiro.caixa : []
        };

        return base;
    },

    hasBusinessData: function(data) {
        const d = this.normalizeData(data);
        return (
            d.orcamentos.length > 0 ||
            d.ordensServico.length > 0 ||
            d.clientes.length > 0 ||
            d.estoque.length > 0 ||
            d.financeiro.contasReceber.length > 0 ||
            d.financeiro.contasPagar.length > 0 ||
            d.financeiro.caixa.length > 0
        );
    },

    init: async function() {
        console.log('IzakGestao iniciando...');
        // Redireciona para login se não autenticado
        try {
            const current = JSON.parse(sessionStorage.getItem('izakCurrentUser'));
            if (!current) {
                window.location.href = 'login.html';
                return;
            }
        } catch (e) {
            window.location.href = 'login.html';
            return;
        }
        this.bindEvents();
        await this.loadData();
        this.updateDashboard();
        this.checkActiveModule();
        console.log('IzakGestao inicializado');
    },

    // Converte texto monetário para número (pt-BR)
    parseCurrencyValue: function(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        const str = String(value);
        return Number(str.replace(/[^0-9,-]/g, '').replace('.', '').replace(',', '.')) || 0;
    },

    // Formata número para BRL
    formatCurrency: function(value) {
        const num = Number(value) || 0;
        try {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(num);
        } catch (err) {
            return `R$ ${num.toFixed(2)}`;
        }
    },
    // Garante que Chart.js esteja carregado: tenta local, depois CDN
    ensureChart: function(callback) {
        if (window.Chart) {
            if (typeof callback === 'function') callback();
            return;
        }
        const tryLoadScript = (src, onSuccess, onFailure) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = () => {
                console.log('Chart.js carregado de:', src);
                if (typeof onSuccess === 'function') onSuccess();
            };
            s.onerror = () => {
                console.warn('Falha ao carregar Chart.js de:', src);
                if (typeof onFailure === 'function') onFailure();
            };
            document.head.appendChild(s);
        };
        // Tenta primeiro local
        tryLoadScript('assets/chart.umd.min.js', () => {
            if (typeof callback === 'function') callback();
        }, () => {
            // Fallback para CDN
            tryLoadScript('https://cdn.jsdelivr.net/npm/chart.js', () => {
                if (typeof callback === 'function') callback();
            }, () => {
                console.error('Não foi possível carregar Chart.js (local nem CDN).');
                if (typeof callback === 'function') callback();
            });
        });
    },
        bindEvents: function() {
        // Navegação entre módulos - apenas links da sidebar
        document.querySelectorAll('nav [data-module]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const module = e.target.getAttribute('data-module');
               IzakGestao.loadModule(module);

            });
        });
        
        // Botão de logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            if(confirm('Deseja realmente sair do sistema?')) {
                // Logout e redirecionamento para login
                try { sessionStorage.removeItem('izakCurrentUser'); } catch {}
                window.location.href = 'login.html';
            }
        });
    },
    
    loadData: async function() {
        console.log('🔄 Carregando dados...');
        
        // Base local imediata para inicialização rápida/fallback
        const local = this.normalizeData(JSON.parse(localStorage.getItem('izakData') || 'null'));
        this.data = local;

        // Tenta sincronizar do servidor local
        try {
            const response = await fetch('/api/data', {
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const payload = await response.json();
            const remote = this.normalizeData(payload && payload.data);

            console.log('📊 Dados recebidos do servidor:', remote);
            console.log('💰 Contas a receber:', remote?.financeiro?.contasReceber?.length || 0);

            // Migração inicial: se servidor estiver vazio e navegador já tiver dados,
            // mantém dados locais e envia ao servidor para centralizar.
            if (!this.hasBusinessData(remote) && this.hasBusinessData(local)) {
                this.data = local;
                this.saveData();
            } else {
                this.data = remote;
                localStorage.setItem('izakData', JSON.stringify(remote));
            }
            
            console.log('✓ Dados finais carregados:', this.data?.financeiro?.contasReceber?.length || 0, 'contas a receber');
        } catch (err) {
            console.warn('Falha ao sincronizar dados do servidor, usando localStorage:', err);
        }
    },
    
    saveData: function() {
        localStorage.setItem('izakData', JSON.stringify(this.data));

        // Sincronização assíncrona com o servidor local.
        fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: this.normalizeData(this.data) })
        }).catch((err) => {
            console.warn('Falha ao salvar dados no servidor local:', err);
        });
    },
    
    loadModule: function(moduleName) {
        console.log('loadModule chamado com:', moduleName);
        if (!moduleName || moduleName === "null") {
            moduleName = "dashboard";
        }
        console.log('Carregando módulo:', moduleName);

        document.getElementById('module-title').textContent = this.getModuleTitle(moduleName);

        document.querySelectorAll('[data-module]').forEach(link => {
            link.classList.remove('active');
        });

        // Adiciona a classe active ao link clicado
        const el = document.querySelector(`[data-module="${moduleName}"]`);
        if (el) {
            el.classList.add('active');
        } else {
            console.warn(`Elemento com data-module="${moduleName}" não encontrado`);
        }
        // Oculta todos os módulos
        // Busca módulos por data-module em qualquer lugar do documento
        const allModules = document.querySelectorAll('div[data-module]');
        console.log('Total módulos encontrados:', allModules.length);
        allModules.forEach(m => console.log('  Módulo:', m.getAttribute('data-module')));
        allModules.forEach(module => {
            module.classList.add('hidden');
        });
        
        // Mostra o módulo selecionado
        // Primeiro tenta dentro de #module-content, depois faz fallback global
        let activeModule = document.querySelector(`#module-content div[data-module="${moduleName}"]`);
        if(!activeModule) {
            activeModule = document.querySelector(`div[data-module="${moduleName}"]`);
        }
        // Se encontrado fora do module-content, move para o container correto
        const moduleContainer = document.getElementById('module-content');
        if(activeModule && moduleContainer && !moduleContainer.contains(activeModule)) {
            console.warn(`Módulo ${moduleName} estava fora de #module-content. Movendo para o container.`);
            try {
                moduleContainer.appendChild(activeModule);
            } catch (e) {
                console.error('Falha ao mover módulo para #module-content:', e);
            }
        }
        console.log(`Procurando módulo: ${moduleName}, encontrado:`, activeModule);
        if(activeModule) {
            activeModule.classList.remove('hidden');
            console.log(`Módulo ${moduleName} exibido`);
        } else {
            console.warn(`Módulo ${moduleName} não encontrado no DOM`);
        }
        
        // Atualiza a URL sem recarregar a página
        history.pushState(null, null, `?module=${moduleName}`);
        
        // Inicializa módulos específicos
        if(moduleName === 'dashboard') {
            this.updateDashboard();
        } else if(moduleName === 'estoque') {
            // Verifica se o módulo de estoque está carregado
            if(typeof EstoqueModule !== 'undefined') {
                EstoqueModule.init();
            }
        } else if(moduleName === 'orcamentos') {
            // Verifica se o módulo de orçamentos está carregado
            if(typeof OrcamentosModule !== 'undefined') {
                OrcamentosModule.init();
            }
        } else if(moduleName === 'os') {
            // Verifica se o módulo de OS está carregado
            if(typeof OSModule !== 'undefined') {
                OSModule.init();
            }
        } else if(moduleName === 'clientes') {
            // Verifica se o módulo de clientes está carregado
            if(typeof ClientesModule !== 'undefined') {
                ClientesModule.init();
            }
        } else if(moduleName === 'financeiro') {
            // Verifica se o módulo de financeiro está carregado
            if(typeof FinanceiroModule !== 'undefined') {
                FinanceiroModule.init();
            }
        } else if(moduleName === 'relatorios') {
            // Verifica se o módulo de relatórios está carregado
            if(typeof RelatoriosModule !== 'undefined') {
                if (!window.Chart) {
                    this.ensureChart(() => RelatoriosModule.init());
                } else {
                    RelatoriosModule.init();
                }
                RelatoriosModule.init();
            }
        }
    },
    
    checkActiveModule: function() {
        // Verifica se há um módulo ativo na URL (para recarregamento)
        const params = new URLSearchParams(window.location.search);
        const moduleName = params.get("module");
        this.loadModule(moduleName);
    },
    
    getModuleTitle: function(moduleName) {
        const titles = {
            'dashboard': 'Dashboard',
            'orcamentos': 'Orçamentos',
            'os': 'Ordens de Serviço',
            'financeiro': 'Financeiro',
            'estoque': 'Estoque',
            'clientes': 'Clientes',
            'relatorios': 'Relatórios'
        };
        return titles[moduleName] || moduleName;
    },
    
    updateDashboard: function() {
        // Atualiza os cards do dashboard
        const orcamentosHoje = document.getElementById('orcamentos-hoje');
        if(orcamentosHoje) {
            orcamentosHoje.textContent = 
                this.data.orcamentos.filter(o => this.isToday(new Date(o.dataCriacao))).length;
        }
        
        const osAndamento = document.getElementById('os-andamento');
        if(osAndamento) {
            osAndamento.textContent = 
                this.data.ordensServico.filter(os => os.status === 'andamento').length;
        }
        
        const contasReceber = document.getElementById('contas-receber');
        if(contasReceber) {
            // Soma valores do módulo Financeiro (contas a receber não pagas)
            const contas = this?.data?.financeiro?.contasReceber || [];
            const totalReceber = contas
                .filter(cr => cr && cr.status !== 'pago')
                .reduce((sum, cr) => sum + (Number(cr.valor) || 0), 0);

            contasReceber.textContent = this.formatCurrency(totalReceber);
        }

        // Atalho: clicar no card de Contas a Receber abre Financeiro/Receber
        const receberCard = contasReceber && contasReceber.parentElement;
        if (receberCard && !receberCard._financeClickBound) {
            receberCard._financeClickBound = true;
            receberCard.addEventListener('click', () => {
                this.loadModule('financeiro');
                if (typeof FinanceiroModule !== 'undefined') {
                    try { FinanceiroModule.switchFinanceTab('receber'); } catch (e) {}
                }
            });
        }
        
        // Atualiza gráficos do dashboard
        this.ensureChart(() => this.updateDashboardCharts());
    },
    
    updateDashboardCharts: function() {
        if (!window.Chart) {
            console.warn('Chart.js não está disponível');
            return;
        }
        
        // Gráfico de Orçamentos
        this.createOrcamentosChart();
        
        // Gráfico de OS
        this.createOSChart();

        // Gráficos Highcharts - com delay para garantir que os dados estão carregados
        const self = this;
        setTimeout(() => {
            self.createHighchartsValoresPorMes();
            self.createHighchartsValoresPorDia();
            self.createHighchartsTopClientes();
            self.createHighchartsReceitaMeta();
        }, 100);
    },
    
    createOrcamentosChart: function() {
        const canvas = document.getElementById('chart-orcamentos');
        if (!canvas) return;
        
        // Destrói gráfico anterior se existir
        if (this.orcamentosChart) {
            this.orcamentosChart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        const orcamentosHoje = this.data.orcamentos.filter(o => this.isToday(new Date(o.dataCriacao))).length;
        const orcamentosOutros = this.data.orcamentos.filter(o => !this.isToday(new Date(o.dataCriacao))).length;
        
        this.orcamentosChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Hoje', 'Outros Dias'],
                datasets: [{
                    data: [orcamentosHoje, orcamentosOutros],
                    backgroundColor: ['#ff6600', '#e0e0e0'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            font: { size: 10 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    createOSChart: function() {
        const canvas = document.getElementById('chart-os');
        if (!canvas) return;
        
        // Destrói gráfico anterior se existir
        if (this.osChart) {
            this.osChart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        const osAndamento = this.data.ordensServico.filter(os => os.status === 'andamento').length;
        const osOutros = this.data.ordensServico.filter(os => os.status !== 'andamento').length;
        
        this.osChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Em Andamento', 'Outros Status'],
                datasets: [{
                    data: [osAndamento, osOutros],
                    backgroundColor: ['#ff6600', '#e0e0e0'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            font: { size: 10 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    createFinanceiroChart: function() {
        const canvas = document.getElementById('chart-financeiro');
        if (!canvas) return;
        
        // Destrói gráfico anterior se existir
        if (this.financeiroChart) {
            this.financeiroChart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        const contas = this?.data?.financeiro?.contasReceber || [];
        
        console.log('📋 createFinanceiroChart - Contas encontradas:', contas.length);
        console.log('📋 Contas:', contas);
        
        const contasPendentes = contas.filter(cr => cr && cr.status !== 'pago').length;
        const contasPagas = contas.filter(cr => cr && cr.status === 'pago').length;
        
        console.log('📊 Pendentes:', contasPendentes, 'Pagas:', contasPagas);
        
        this.financeiroChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pendentes', 'Pagas'],
                datasets: [{
                    data: [contasPendentes, contasPagas],
                    backgroundColor: ['#ff6600', '#4caf50'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            font: { size: 10 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    // Gráficos Highcharts para o Dashboard
    createHighchartsValoresPorMes: function() {
        try {
            const container = document.getElementById('chart-valores-mes');
            if (!container) {
                console.warn('Container chart-valores-mes não encontrado');
                return;
            }

            // Verifica se Highcharts está disponível
            if (typeof Highcharts === 'undefined') {
                console.warn('Highcharts não está carregado');
                return;
            }

            // Agrupa dados de contas a receber por mês (apenas pagas)
            const mesesData = {};
            const hoje = new Date();
            
            // Inicializa meses de 2026 até o mês atual
            for (let i = 0; i <= hoje.getMonth(); i++) {
                const data = new Date(2026, i, 1);
                const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
                mesesData[chave] = 0;
            }

            // Processa contas a receber pagas
            if (this.data && this.data.financeiro && this.data.financeiro.contasReceber) {
                console.log('Contas a receber disponíveis:', this.data.financeiro.contasReceber);
                this.data.financeiro.contasReceber.forEach(cr => {
                    console.log('Processando conta:', cr.id, 'Status:', cr.status, 'Valor:', cr.valor, 'Data Pagamento:', cr.dataPagamento);
                    if (cr.status === 'pago' && cr.dataPagamento) {
                        const dataPagamento = new Date(cr.dataPagamento);
                        const chave = `${dataPagamento.getFullYear()}-${String(dataPagamento.getMonth() + 1).padStart(2, '0')}`;
                        if (mesesData.hasOwnProperty(chave)) {
                            mesesData[chave] += Number(cr.valor) || 0;
                            console.log(`Adicionado R$ ${cr.valor} ao mês ${chave}`);
                        }
                    }
                });
            } else {
                console.warn('Financeiro ou contasReceber não encontrados:', this.data?.financeiro);
            }

            // Formata dados para Highcharts
            const meses = Object.keys(mesesData).sort();
            const valores = meses.map(m => mesesData[m]);
            const labels = meses.map(m => {
                const [ano, mes] = m.split('-');
                const data = new Date(ano, mes - 1);
                return data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            });

            console.log('Gráfico por Mês - Dados:', { meses, valores, labels });

            // Cria gráfico Highcharts
            Highcharts.chart('chart-valores-mes', {
                chart: {
                    type: 'column',
                    height: 400
                },
                title: {
                    text: null
                },
                xAxis: {
                    categories: labels,
                    crosshair: true
                },
                yAxis: {
                    title: {
                        text: 'Valor (R$)'
                    },
                    labels: {
                        formatter: function() {
                            return 'R$ ' + this.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
                        }
                    }
                },
                tooltip: {
                    headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0"><b>{series.name}: </b></td>' +
                        '<td style="padding:0"><b>R$ {point.y:.2f}</b></td></tr>',
                    footerFormat: '</table>',
                    shared: true,
                    useHTML: true
                },
                plotOptions: {
                    column: {
                        pointPadding: 0.2,
                        borderWidth: 0,
                        dataLabels: {
                            enabled: true,
                            align: 'top',
                            verticalAlign: 'top',
                            inside: false,
                            formatter: function() {
                                if (this.y === 0) return '';
                                return 'R$ ' + this.y.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
                            }
                        }
                    }
                },
                legend: {
                    enabled: false
                },
                series: [{
                    name: 'Valores Recebidos',
                    data: valores,
                    color: 'rgba(39, 174, 96, 0.7)',
                    borderColor: 'rgba(39, 174, 96, 1)'
                }]
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de valores por mês:', error);
        }
    },

    createHighchartsValoresPorDia: function() {
        try {
            const container = document.getElementById('chart-valores-dia');
            if (!container) {
                console.warn('Container chart-valores-dia não encontrado');
                return;
            }

            // Verifica se Highcharts está disponível
            if (typeof Highcharts === 'undefined') {
                console.warn('Highcharts não está carregado');
                return;
            }

            // Agrupa dados de contas a receber por dia do mês atual
            const diasData = {};
            const hoje = new Date();
            const mesAtual = hoje.getMonth();
            const anoAtual = hoje.getFullYear();

            // Inicializa todos os dias do mês
            const ultimoDia = new Date(anoAtual, mesAtual + 1, 0).getDate();
            for (let dia = 1; dia <= ultimoDia; dia++) {
                diasData[String(dia).padStart(2, '0')] = 0;
            }

            // Processa contas a receber pagas neste mês
            if (this.data && this.data.financeiro && this.data.financeiro.contasReceber) {
                console.log('Processando contas do mês:', mesAtual + 1, '/', anoAtual);
                this.data.financeiro.contasReceber.forEach(cr => {
                    console.log('Conta:', cr.id, 'Status:', cr.status, 'Data:', cr.dataPagamento);
                    if (cr.status === 'pago' && cr.dataPagamento) {
                        const dataPagamento = new Date(cr.dataPagamento);
                        if (dataPagamento.getMonth() === mesAtual && dataPagamento.getFullYear() === anoAtual) {
                            const dia = String(dataPagamento.getDate()).padStart(2, '0');
                            diasData[dia] += Number(cr.valor) || 0;
                            console.log(`Adicionado R$ ${cr.valor} ao dia ${dia}`);
                        }
                    }
                });
            } else {
                console.warn('Financeiro ou contasReceber não encontrados para dia');
            }

            // Formata dados para Highcharts
            const dias = Object.keys(diasData).sort();
            const valores = dias.map(d => diasData[d]);

            console.log('Gráfico por Dia - Dados:', { dias, valores });

            // Cria gráfico Highcharts
            Highcharts.chart('chart-valores-dia', {
                chart: {
                    type: 'area',
                    height: 400
                },
                title: {
                    text: null
                },
                xAxis: {
                    categories: dias.map(d => `Dia ${d}`),
                    crosshair: true
                },
                yAxis: {
                    title: {
                        text: 'Valor (R$)'
                    },
                    labels: {
                        formatter: function() {
                            return 'R$ ' + this.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
                        }
                    }
                },
                tooltip: {
                    headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0"><b>{series.name}: </b></td>' +
                        '<td style="padding:0"><b>R$ {point.y:.2f}</b></td></tr>',
                    footerFormat: '</table>',
                    shared: true,
                    useHTML: true
                },
                plotOptions: {
                    area: {
                        fillColor: 'rgba(0, 85, 164, 0.1)',
                        dataLabels: {
                            enabled: true,
                            align: 'center',
                            verticalAlign: 'top',
                            inside: false,
                            formatter: function() {
                                if (this.y === 0) return '';
                                return 'R$ ' + this.y.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
                            }
                        }
                    }
                },
                legend: {
                    enabled: false
                },
                series: [{
                    name: 'Valores Recebidos',
                    data: valores,
                    color: 'rgba(0, 85, 164, 1)'
                }]
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de valores por dia:', error);
        }
    },

    createHighchartsStatusPagamentos: function() {
        try {
            const container = document.getElementById('chart-status-pagamentos');
            if (!container) {
                console.warn('Container chart-status-pagamentos não encontrado');
                return;
            }

            if (typeof Highcharts === 'undefined') {
                console.warn('Highcharts não está carregado');
                return;
            }

            console.log('Dados financeiro completo:', this.data?.financeiro);

            // Soma valores pagos e pendentes
            let valorPago = 0;
            let valorPendente = 0;

            if (this.data && this.data.financeiro && this.data.financeiro.contasReceber) {
                console.log('Contas a receber encontradas:', this.data.financeiro.contasReceber.length);
                this.data.financeiro.contasReceber.forEach((cr, index) => {
                    console.log(`Conta ${index}:`, cr.id, 'Status:', cr.status, 'Valor:', cr.valor);
                    if (cr.status === 'pago') {
                        valorPago += Number(cr.valor) || 0;
                        console.log(`  → Adicionado ao Pago: R$ ${cr.valor}`);
                    } else if (cr.status === 'pendente' || cr.status === 'atrasado') {
                        valorPendente += Number(cr.valor) || 0;
                        console.log(`  → Adicionado ao Pendente: R$ ${cr.valor}`);
                    }
                });
            } else {
                console.warn('Nenhuma conta a receber encontrada ou financeiro vazio');
                console.log('this.data:', this.data);
            }

            console.log('Valores Recebidos - Final:', { valorPago, valorPendente });

            Highcharts.chart('chart-status-pagamentos', {
                chart: {
                    type: 'bar',
                    height: 300,
                    marginRight: 250,
                    marginLeft: 100
                },
                title: {
                    text: null
                },
                xAxis: {
                    categories: ['Valores'],
                    title: {
                        text: null
                    }
                },
                yAxis: {
                    title: {
                        text: 'Valor (R$)'
                    },
                    labels: {
                        formatter: function() {
                            return 'R$ ' + this.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
                        }
                    }
                },
                tooltip: {
                    pointFormat: '<b>{series.name}:</b> R$ {point.y:.2f}'
                },
                plotOptions: {
                    bar: {
                        stacking: false,
                        dataLabels: {
                            enabled: true,
                            align: 'right',
                            inside: false,
                            crop: false,
                            overflow: 'allow',
                            distance: 10,
                            style: {
                                fontWeight: 'bold',
                                fontSize: '14px',
                                color: '#333',
                                textOutline: 'none'
                            },
                            formatter: function() {
                                return 'R$ ' + this.y.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
                            }
                        }
                    }
                },
                legend: {
                    enabled: true,
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'middle'
                },
                series: [
                    {
                        name: 'Recebido',
                        data: [valorPago],
                        color: '#27ae60',
                        dataLabels: {
                            enabled: true,
                            align: 'right',
                            distance: 10,
                            color: '#27ae60',
                            style: {
                                fontWeight: 'bold',
                                fontSize: '14px'
                            },
                            formatter: function() {
                                if (this.y === 0) return '';
                                return 'R$ ' + this.y.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
                            }
                        }
                    },
                    {
                        name: 'Pendente',
                        data: [valorPendente],
                        color: '#f39c12',
                        dataLabels: {
                            enabled: true,
                            align: 'right',
                            distance: 10,
                            color: '#f39c12',
                            style: {
                                fontWeight: 'bold',
                                fontSize: '14px'
                            },
                            formatter: function() {
                                if (this.y === 0) return '';
                                return 'R$ ' + this.y.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
                            }
                        }
                    }
                ]
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de status pagamentos:', error);
        }
    },

    createHighchartsTopClientes: function() {
        try {
            const container = document.getElementById('chart-top-clientes');
            if (!container) {
                console.warn('Container chart-top-clientes não encontrado');
                return;
            }

            if (typeof Highcharts === 'undefined') {
                console.warn('Highcharts não está carregado');
                return;
            }

            // Agrupa contas por cliente e soma valores pagos
            const clientesData = {};

            if (this.data && this.data.financeiro && this.data.financeiro.contasReceber) {
                this.data.financeiro.contasReceber.forEach(cr => {
                    if (cr.status === 'pago') {
                        const cliente = cr.clienteFornecedor || cr.cliente || 'Cliente Desconhecido';
                        if (!clientesData[cliente]) {
                            clientesData[cliente] = 0;
                        }
                        clientesData[cliente] += Number(cr.valor) || 0;
                    }
                });
            }

            // Ordena por valor decrescente e pega top 5
            const top5 = Object.entries(clientesData)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([nome, valor]) => ({ name: nome, y: valor }));

            console.log('Top 5 Clientes:', top5);

            Highcharts.chart('chart-top-clientes', {
                chart: {
                    type: 'bar',
                    height: 400
                },
                title: {
                    text: null
                },
                xAxis: {
                    categories: top5.map(c => c.name),
                    title: {
                        text: null
                    }
                },
                yAxis: {
                    title: {
                        text: 'Valor (R$)'
                    },
                    labels: {
                        formatter: function() {
                            return 'R$ ' + this.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
                        }
                    }
                },
                tooltip: {
                    pointFormat: '<b>R$ {point.y:.2f}</b>'
                },
                plotOptions: {
                    bar: {
                        dataLabels: {
                            enabled: true,
                            align: 'right',
                            inside: false,
                            formatter: function() {
                                return 'R$ ' + this.y.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
                            }
                        }
                    }
                },
                legend: {
                    enabled: false
                },
                series: [{
                    name: 'Faturamento',
                    data: top5,
                    color: '#0055A4'
                }]
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de top clientes:', error);
        }
    },

    createHighchartsReceitaMeta: function() {
        try {
            const container = document.getElementById('chart-receita-meta');
            if (!container) {
                console.warn('Container chart-receita-meta não encontrado');
                return;
            }

            if (typeof Highcharts === 'undefined') {
                console.warn('Highcharts não está carregado');
                return;
            }

            // Calcula receita de 2026 até o mês atual
            const mesesData = {};
            const hoje = new Date();
            const anoAtual = 2026; // Começa em 2026
            
            // Inicializa de janeiro até o mês atual
            for (let i = 0; i <= hoje.getMonth(); i++) {
                const data = new Date(anoAtual, i, 1);
                const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
                mesesData[chave] = { receita: 0, meta: 5000 }; // Meta padrão de 5000
            }

            // Processa contas a receber pagas
            if (this.data && this.data.financeiro && this.data.financeiro.contasReceber) {
                this.data.financeiro.contasReceber.forEach(cr => {
                    if (cr.status === 'pago' && cr.dataPagamento) {
                        const dataPagamento = new Date(cr.dataPagamento);
                        const chave = `${dataPagamento.getFullYear()}-${String(dataPagamento.getMonth() + 1).padStart(2, '0')}`;
                        if (mesesData[chave]) {
                            mesesData[chave].receita += Number(cr.valor) || 0;
                        }
                    }
                });
            }

            // Formata dados
            const meses = Object.keys(mesesData).sort();
            const labels = meses.map(m => {
                const [ano, mes] = m.split('-');
                const data = new Date(ano, mes - 1);
                return data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            });
            const receitas = meses.map(m => mesesData[m].receita);
            const metas = meses.map(m => mesesData[m].meta);

            console.log('Receita vs Meta:', { meses, receitas, metas });

            Highcharts.chart('chart-receita-meta', {
                chart: {
                    type: 'column',
                    height: 400
                },
                title: {
                    text: null
                },
                xAxis: {
                    categories: labels,
                    crosshair: true
                },
                yAxis: {
                    title: {
                        text: 'Valor (R$)'
                    },
                    labels: {
                        formatter: function() {
                            return 'R$ ' + this.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
                        }
                    }
                },
                tooltip: {
                    headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0"><b>{series.name}: </b></td>' +
                        '<td style="padding:0"><b>R$ {point.y:.2f}</b></td></tr>',
                    footerFormat: '</table>',
                    shared: true,
                    useHTML: true
                },
                plotOptions: {
                    column: {
                        pointPadding: 0.2,
                        borderWidth: 0,
                        dataLabels: {
                            enabled: true,
                            align: 'top',
                            verticalAlign: 'top',
                            inside: false,
                            formatter: function() {
                                if (this.y === 0) return '';
                                return 'R$ ' + this.y.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
                            }
                        }
                    }
                },
                legend: {
                    enabled: true,
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'middle'
                },
                series: [
                    {
                        name: 'Receita Realizada',
                        data: receitas,
                        color: '#27ae60'
                    },
                    {
                        name: 'Meta Mensal',
                        data: metas,
                        color: '#3498db',
                        dashStyle: 'shortdot'
                    }
                ]
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de receita vs meta:', error);
        }
    },

    // Coordenadas da empresa (Izak Comunicação Visual - Anápolis - CEP 75064020)
    empresaCoordenadas: { 
        lat: -15.2958, 
        lng: -48.9527, 
        nome: 'Izak Comunicação Visual',
        cep: '75064020'
    },

    // Cache de geocodificação simples
    geocodeCache: {},

    // Função para obter coordenadas aproximadas de um endereço em Anápolis
    geocodeEndereco: async function(endereco) {
        // Função removida - usando apenas coordenadas aproximadas de bairros
        return null;
    },

    // Coordenadas aproximadas dos principais bairros de Anápolis (relativas ao centro - CEP 75064020)
    getAproximadoCoordenadas: function(bairro) {
        const bairros = {
            'centro': { lat: -15.2958, lng: -48.9527 },
            'setor central': { lat: -15.2958, lng: -48.9527 },
            'vila santa cecília': { lat: -15.3050, lng: -48.9450 },
            'vila américa': { lat: -15.3100, lng: -48.9500 },
            'jundiaí': { lat: -15.3150, lng: -48.9400 },
            'bairro novo': { lat: -15.3050, lng: -48.9600 },
            'morada do sol': { lat: -15.2900, lng: -48.9600 },
            'parque villa': { lat: -15.2850, lng: -48.9500 }
        };

        const chaveBairro = bairro ? bairro.toLowerCase() : 'centro';
        const coordenadas = bairros[chaveBairro] || { lat: -15.2958, lng: -48.9527 };
        
        // Adiciona um pouco de variação para não sobrepor pontos
        return {
            lat: coordenadas.lat + (Math.random() - 0.5) * 0.01,
            lng: coordenadas.lng + (Math.random() - 0.5) * 0.01,
            nome: bairro || 'Centro'
        };
    },

    // Referência do mapa Leaflet
    leafletMap: null,

    createLeafletMapaClientes: function() {
        try {
            const container = document.getElementById('map-container');
            if (!container) {
                console.error('Container map-container NÃO encontrado!');
                return;
            }

            // Verifica se Leaflet está carregado
            if (typeof L === 'undefined') {
                console.error('Leaflet não está carregado');
                container.innerHTML = '<p style="padding: 20px; color: red;">Erro ao carregar biblioteca Leaflet.</p>';
                return;
            }

            // Destroi o mapa anterior se existir
            if (this.leafletMap) {
                console.log('Destruindo mapa anterior...');
                this.leafletMap.off();
                this.leafletMap.remove();
                this.leafletMap = null;
            }

            // Garante dimensões do container
            container.style.height = '500px';
            container.style.width = '100%';
            container.style.display = 'block';
            container.style.position = 'relative';

            // Limpa conteúdo antigo
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }

            console.log('Container dimensions:', {
                height: container.offsetHeight,
                width: container.offsetWidth,
                visible: container.offsetHeight > 0 && container.offsetWidth > 0
            });

            // Delay maior para garantir que o DOM está pronto
            setTimeout(() => {
                if (!this.leafletMap) {
                    try {
                        console.log('Criando novo mapa Leaflet...');

                        // Cria o mapa
                        this.leafletMap = L.map('map-container', {
                            preferCanvas: true,
                            fadeAnimation: false,
                            zoomAnimation: false,
                            markerZoomAnimation: false
                        });

                        // Define a view DEPOIS de criar o mapa
                        this.leafletMap.setView(
                            [this.empresaCoordenadas.lat, this.empresaCoordenadas.lng], 
                            14
                        );

                        // Adiciona camada de mapa (OpenStreetMap)
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '© OpenStreetMap contributors',
                            maxZoom: 19,
                            minZoom: 2
                        }).addTo(this.leafletMap);

                        console.log('Mapa criado, adicionando marcadores...');

                        // Marcador da empresa
                        const markerEmpresa = L.circleMarker(
                            [this.empresaCoordenadas.lat, this.empresaCoordenadas.lng],
                            {
                                radius: 12,
                                fillColor: '#ff6600',
                                color: '#ff6600',
                                weight: 3,
                                opacity: 1,
                                fillOpacity: 0.9
                            }
                        ).addTo(this.leafletMap);

                        markerEmpresa.bindPopup(`
                            <div style="font-weight: bold; color: #ff6600;">
                                ${this.empresaCoordenadas.nome}
                            </div>
                            <small>CEP: ${this.empresaCoordenadas.cep}</small>
                        `);

                        // Coleta dados de clientes
                        let clientesComCoordenadas = [];
                        let bounds = L.latLngBounds([this.empresaCoordenadas.lat, this.empresaCoordenadas.lng]);

                        if (this.data && this.data.clientes && this.data.clientes.length > 0) {
                            console.log('Processando', this.data.clientes.length, 'clientes');

                            this.data.clientes.forEach(cliente => {
                                if (cliente.endereco && cliente.endereco.bairro) {
                                    // Usa coordenadas aproximadas do bairro
                                    const coords = this.getAproximadoCoordenadas(cliente.endereco.bairro);
                                    
                                    clientesComCoordenadas.push({
                                        id: cliente.id,
                                        nome: cliente.nome,
                                        bairro: cliente.endereco.bairro,
                                        cidade: cliente.endereco.cidade,
                                        lat: coords.lat,
                                        lng: coords.lng,
                                        endereco: cliente.endereco
                                    });

                                    // Adiciona ao bounds para zoom automático
                                    bounds.extend([coords.lat, coords.lng]);

                                    // Marcador do cliente
                                    const markerCliente = L.circleMarker(
                                        [coords.lat, coords.lng],
                                        {
                                            radius: 8,
                                            fillColor: '#4caf50',
                                            color: '#2e7d32',
                                            weight: 2,
                                            opacity: 1,
                                            fillOpacity: 0.8
                                        }
                                    ).addTo(this.leafletMap);

                                    markerCliente.bindPopup(`
                                        <div style="font-weight: bold; color: #4caf50;">
                                            ${cliente.nome}
                                        </div>
                                        <small>
                                            ${cliente.endereco.logradouro || ''} ${cliente.endereco.numero || ''}<br>
                                            ${cliente.endereco.bairro || ''} - ${cliente.endereco.cidade || 'Anápolis'}<br>
                                            CEP: ${cliente.endereco.cep || 'N/A'}
                                        </small>
                                    `);

                                    // Desenha linha da empresa para o cliente
                                    const linha = L.polyline(
                                        [
                                            [this.empresaCoordenadas.lat, this.empresaCoordenadas.lng],
                                            [coords.lat, coords.lng]
                                        ],
                                        {
                                            color: 'rgba(100, 150, 200, 0.7)',
                                            weight: 2,
                                            opacity: 0.7,
                                            dashArray: '5, 5'
                                        }
                                    ).addTo(this.leafletMap);

                                    linha.bindPopup(`Conexão: ${this.empresaCoordenadas.nome} → ${cliente.nome}`);
                                }
                            });
                        }

                        console.log('Mapa Leaflet criado com', clientesComCoordenadas.length, 'clientes');

                        // Força invalidar size do mapa
                        this.leafletMap.invalidateSize();

                        // Ajusta o mapa para mostrar todos os marcadores
                        if (clientesComCoordenadas.length > 0) {
                            this.leafletMap.fitBounds(bounds.pad(0.1));
                        }

                    } catch (error) {
                        console.error('Erro interno ao criar mapa:', error, error.stack);
                    }
                }
            }, 200);

        } catch (error) {
            console.error('Erro ao criar mapa Leaflet:', error);
            const container = document.getElementById('map-container');
            if (container) {
                container.innerHTML = `<p style="padding: 20px; color: red;">Erro ao renderizar mapa: ${error.message}</p>`;
            }
        }
    },

    createVegaMapaClientes: async function() {
        // Função removida - usando Leaflet agora
    },
    
    isToday: function(someDate) {
        const today = new Date();
        return someDate.getDate() === today.getDate() &&
               someDate.getMonth() === today.getMonth() &&
               someDate.getFullYear() === today.getFullYear();
    }
};

// Inicializa o aplicativo quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    IzakGestao.init();
    
    // Menu móvel toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const navLinks = document.querySelectorAll('.sidebar nav a');
    
    if (mobileMenuToggle && sidebar && sidebarOverlay) {
        // Abrir menu
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            mobileMenuToggle.setAttribute('aria-label', 'Fechar menu');
        });
        
        // Fechar menu ao clicar no overlay
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            mobileMenuToggle.setAttribute('aria-label', 'Abrir menu');
        });
        
        // Fechar menu ao clicar em um link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-label', 'Abrir menu');
                }
            });
        });
        
        // Fechar menu ao pressionar ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-label', 'Abrir menu');
            }
        });
    }
});