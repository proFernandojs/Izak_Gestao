// Objeto principal do aplicativo
const IzakGestao = {
    init: function() {
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
        this.loadData();
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
    
    loadData: function() {
        // Carrega dados do localStorage ou inicializa se não existir
        this.data = JSON.parse(localStorage.getItem('izakData')) || {
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
    
    saveData: function() {
        localStorage.setItem('izakData', JSON.stringify(this.data));
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
        
        // Gráfico Financeiro
        this.createFinanceiroChart();
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
        const contasPendentes = contas.filter(cr => cr && cr.status !== 'pago').length;
        const contasPagas = contas.filter(cr => cr && cr.status === 'pago').length;
        
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