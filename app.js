// Objeto principal do aplicativo
const IzakGestao = {
    init: function() {
        this.bindEvents();
        this.loadData();
        this.updateDashboard();
        this.checkActiveModule();
    },
    
    
    bindEvents: function() {
        // Navegação entre módulos
        document.querySelectorAll('[data-module]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const module = link.getAttribute('data-module');
                if(module) {
                    this.loadModule(module);
                }
            });
        });
        
        // Botão de logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            if(confirm('Deseja realmente sair do sistema?')) {
                // Simular logout
                window.location.reload();
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
    
    checkActiveModule: function() {
        // Verifica se há um módulo ativo na URL (para recarregamento)
        const urlParams = new URLSearchParams(window.location.search);
        const module = urlParams.get('module');
        
        if(module) {
            this.loadModule(module);
        }
    },
    
    loadModule: function(moduleName) {
        // Atualiza o título
        document.getElementById('module-title').textContent = this.getModuleTitle(moduleName);
        
        // Remove a classe active de todos os links
        document.querySelectorAll('[data-module]').forEach(link => {
            link.classList.remove('active');
        });
        
        // Adiciona a classe active ao link clicado (verifica existência)
        const activeLink = document.querySelector(`[data-module="${moduleName}"]`);
        if(activeLink) {
            activeLink.classList.add('active');
        }
        
        // Oculta todos os módulos
        document.querySelectorAll('#module-content > [data-module]').forEach(module => {
            module.classList.add('hidden');
        });
        
        // Mostra o módulo selecionado
        const activeModule = document.querySelector(`#module-content > [data-module="${moduleName}"]`);
        if(activeModule) {
            activeModule.classList.remove('hidden');
        }
        
        // Atualiza a URL sem recarregar a página
        history.pushState(null, null, `?module=${moduleName}`);
        
        // Inicializa módulos específicos
        if(moduleName === 'dashboard') {
            this.updateDashboard();
        } else if(moduleName === 'estoque') {
             if(typeof EstoqueModule !== 'undefined' && !window.estoqueInitialized) {
                 window.estoqueInitialized = true;
                 EstoqueModule.init();
            }
        }
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
        document.getElementById('orcamentos-hoje').textContent = 
            this.data.orcamentos.filter(o => this.isToday(new Date(o.data))).length;
        
        document.getElementById('os-andamento').textContent = 
            this.data.ordensServico.filter(os => os.status === 'andamento').length;
        
        const totalReceber = this.data.financeiro.contasReceber
            .filter(cr => !cr.pago)
            .reduce((sum, cr) => sum + cr.valor, 0);
        
        document.getElementById('contas-receber').textContent = 
            `R$ ${totalReceber.toFixed(2)}`;
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
});