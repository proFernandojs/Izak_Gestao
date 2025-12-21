// Módulo de Orçamentos
const OrcamentosModule = {
    currentTab: 0,
    tabs: ['cliente', 'itens', 'pagamento'],
    currentOrcamento: null,
    
    init: function() {
        this.renderOrcamentosList();
        this.bindEvents();
        this.initForm();
    },
    
    bindEvents: function() {
        // Botão para adicionar novo orçamento
        document.getElementById('add-orcamento-btn').addEventListener('click', () => {
            this.showOrcamentoForm();
        });
        
        // Formulário de salvamento
        document.getElementById('orcamento-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveOrcamento();
        });
        
        // Cancelar formulário
        document.getElementById('cancel-orcamento-btn').addEventListener('click', () => {
            this.hideOrcamentoForm();
        });
        
        // Navegação entre abas
        document.getElementById('prev-tab-btn').addEventListener('click', () => {
            this.prevTab();
        });
        
        document.getElementById('next-tab-btn').addEventListener('click', () => {
            this.nextTab();
        });
        
        // Tabs do formulário
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });
        
        // Filtros
        document.getElementById('search-orcamento').addEventListener('input', (e) => {
            this.filterOrcamentos(e.target.value);
        });
        
        document.getElementById('filter-status').addEventListener('change', (e) => {
            this.filterByStatus(e.target.value);
        });
        
        document.getElementById('filter-date').addEventListener('change', (e) => {
            this.filterByDate(e.target.value);
        });
        
        document.getElementById('clear-filters').addEventListener('click', () => {
            this.clearFilters();
        });
        
        // Adicionar item no orçamento
        document.getElementById('add-item-btn').addEventListener('click', () => {
            this.addItemRow();
        });
        
        // Desconto
        document.getElementById('desconto').addEventListener('input', () => {
            this.calcularTotal();
        });
    },
    
    showOrcamentoForm: function(orcamento = null) {
        this.currentOrcamento = orcamento;
        this.currentTab = 0;
        
        const form = document.getElementById('orcamento-form');
        form.reset();
        
        if(orcamento) {
            // Modo edição
            form.dataset.id = orcamento.id;
            document.getElementById('cliente-nome').value = orcamento.cliente.nome;
            document.getElementById('cliente-telefone').value = orcamento.cliente.telefone || '';
            document.getElementById('cliente-email').value = orcamento.cliente.email || '';
            document.getElementById('cliente-descricao').value = orcamento.descricao;
            
            // Carrega itens
            this.loadItens(orcamento.itens);
            
            document.getElementById('forma-pagamento').value = orcamento.pagamento.forma;
            document.getElementById('prazo-entrega').value = orcamento.pagamento.prazo;
            document.getElementById('observacoes').value = orcamento.observacoes || '';
            document.getElementById('orcamento-status').value = orcamento.status;
            
            document.getElementById('orcamento-form-title').textContent = 'Editar Orçamento';
        } else {
            // Modo criação
            form.removeAttribute('data-id');
            this.addItemRow();
            document.getElementById('orcamento-form-title').textContent = 'Novo Orçamento';
        }
        
        this.switchTab('cliente');
        this.calcularTotal();
        
        document.getElementById('orcamento-form-container').classList.remove('hidden');
        document.getElementById('orcamentos-list-container').classList.add('hidden');
    },
    
    hideOrcamentoForm: function() {
        document.getElementById('orcamento-form-container').classList.add('hidden');
        document.getElementById('orcamentos-list-container').classList.remove('hidden');
    },
    
    initForm: function() {
        this.addItemRow();
    },
    
    switchTab: function(tabName) {
        // Atualiza botões das tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if(btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Atualiza conteúdo das tabs
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if(content.id === `tab-${tabName}`) {
                content.classList.add('active');
            }
        });
        
        // Atualiza índice atual
        this.currentTab = this.tabs.indexOf(tabName);
        
        // Atualiza botões de navegação
        this.updateNavButtons();
    },
    
    prevTab: function() {
        if(this.currentTab > 0) {
            this.switchTab(this.tabs[this.currentTab - 1]);
        }
    },
    
    nextTab: function() {
        if(this.currentTab < this.tabs.length - 1) {
            this.switchTab(this.tabs[this.currentTab + 1]);
        }
    },
    
    updateNavButtons: function() {
        const prevBtn = document.getElementById('prev-tab-btn');
        const nextBtn = document.getElementById('next-tab-btn');
        const submitBtn = document.getElementById('submit-orcamento-btn');
        
        if(this.currentTab === 0) {
            prevBtn.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
        }
        
        if(this.currentTab === this.tabs.length - 1) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
        }
    },
    
    addItemRow: function(item = null) {
        const itensList = document.getElementById('itens-list');
        const itemId = Date.now() + Math.random().toString(36).substr(2, 9);
        
        const itemRow = document.createElement('div');
        itemRow.className = 'item-row';
        itemRow.id = `item-${itemId}`;
        
        itemRow.innerHTML = `
            <input type="text" class="item-descricao" placeholder="Descrição" value="${item ? item.descricao : ''}">
            <input type="number" class="item-quantidade" placeholder="Qtd" min="1" value="${item ? item.quantidade : 1}" step="1">
            <input type="number" class="item-valor" placeholder="Valor Unitário" min="0" value="${item ? item.valorUnitario : 0}" step="0.01">
            <input type="number" class="item-total" placeholder="Total" readonly value="${item ? item.total : 0}">
            <button type="button" class="remove-item">Remover</button>
        `;
        
        itensList.appendChild(itemRow);
        
        // Adiciona eventos aos campos
        const qtdInput = itemRow.querySelector('.item-quantidade');
        const valorInput = itemRow.querySelector('.item-valor');
        const totalInput = itemRow.querySelector('.item-total');
        
        const calcularItemTotal = () => {
            const qtd = parseFloat(qtdInput.value) || 0;
            const valor = parseFloat(valorInput.value) || 0;
            totalInput.value = (qtd * valor).toFixed(2);
            this.calcularTotal();
        };
        
        qtdInput.addEventListener('input', calcularItemTotal);
        valorInput.addEventListener('input', calcularItemTotal);
        
        // Botão remover
        itemRow.querySelector('.remove-item').addEventListener('click', () => {
            itemRow.remove();
            this.calcularTotal();
        });
        
        // Calcular total inicial
        calcularItemTotal();
    },
    
    loadItens: function(itens) {
        const itensList = document.getElementById('itens-list');
        itensList.innerHTML = '';
        
        if(itens && itens.length > 0) {
            itens.forEach(item => {
                this.addItemRow(item);
            });
        } else {
            this.addItemRow();
        }
    },
    
    calcularTotal: function() {
        let subtotal = 0;
        
        document.querySelectorAll('.item-row').forEach(row => {
            const total = parseFloat(row.querySelector('.item-total').value) || 0;
            subtotal += total;
        });
        
        const descontoPercent = parseFloat(document.getElementById('desconto').value) || 0;
        const descontoValor = subtotal * (descontoPercent / 100);
        const total = subtotal - descontoValor;
        
        document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
        document.getElementById('valor-desconto').textContent = `R$ ${descontoValor.toFixed(2)}`;
        document.getElementById('total').textContent = `R$ ${total.toFixed(2)}`;
    },
    
    saveOrcamento: function() {
        const form = document.getElementById('orcamento-form');
        
        // Coleta os itens
        const itens = [];
        document.querySelectorAll('.item-row').forEach(row => {
            const descricao = row.querySelector('.item-descricao').value;
            const quantidade = parseFloat(row.querySelector('.item-quantidade').value) || 0;
            const valorUnitario = parseFloat(row.querySelector('.item-valor').value) || 0;
            const total = parseFloat(row.querySelector('.item-total').value) || 0;
            
            if(descricao && quantidade > 0 && valorUnitario > 0) {
                itens.push({
                    descricao,
                    quantidade,
                    valorUnitario,
                    total
                });
            }
        });
        
        // Valida se há itens
        if(itens.length === 0) {
            alert('Adicione pelo menos um item ao orçamento.');
            this.switchTab('itens');
            return;
        }
        
        const orcamento = {
            id: form.dataset.id || Date.now().toString(),
            numero: form.dataset.id ? this.getOrcamentoNumero(form.dataset.id) : this.generateOrcamentoNumero(),
            cliente: {
                nome: document.getElementById('cliente-nome').value,
                telefone: document.getElementById('cliente-telefone').value,
                email: document.getElementById('cliente-email').value
            },
            descricao: document.getElementById('cliente-descricao').value,
            itens: itens,
            subtotal: parseFloat(document.getElementById('subtotal').textContent.replace('R$ ', '').replace('.', '').replace(',', '.')),
            desconto: parseFloat(document.getElementById('desconto').value) || 0,
            total: parseFloat(document.getElementById('total').textContent.replace('R$ ', '').replace('.', '').replace(',', '.')),
            pagamento: {
                forma: document.getElementById('forma-pagamento').value,
                prazo: parseInt(document.getElementById('prazo-entrega').value) || 7
            },
            observacoes: document.getElementById('observacoes').value,
            status: document.getElementById('orcamento-status').value,
            dataCriacao: form.dataset.id ? this.currentOrcamento.dataCriacao : new Date().toISOString(),
            dataAtualizacao: new Date().toISOString()
        };
        
        // Atualiza ou adiciona o orçamento
        const index = IzakGestao.data.orcamentos.findIndex(o => o.id === orcamento.id);
        if(index >= 0) {
            IzakGestao.data.orcamentos[index] = orcamento;
        } else {
            IzakGestao.data.orcamentos.push(orcamento);
        }
        
        IzakGestao.saveData();
        this.renderOrcamentosList();
        this.hideOrcamentoForm();
        
        // Atualiza dashboard
        IzakGestao.updateDashboard();
    },
    
    generateOrcamentoNumero: function() {
        const year = new Date().getFullYear();
        const count = (IzakGestao.data.orcamentos.length + 1).toString().padStart(4, '0');
        return `ORC${year}${count}`;
    },
    
    getOrcamentoNumero: function(id) {
        const orcamento = IzakGestao.data.orcamentos.find(o => o.id === id);
        return orcamento ? orcamento.numero : this.generateOrcamentoNumero();
    },
    
    deleteOrcamento: function(id) {
        if(confirm('Tem certeza que deseja excluir este orçamento?')) {
            IzakGestao.data.orcamentos = IzakGestao.data.orcamentos.filter(o => o.id !== id);
            IzakGestao.saveData();
            this.renderOrcamentosList();
        }
    },
    
    filterOrcamentos: function(searchTerm) {
        const orcamentos = document.querySelectorAll('.orcamento-item');
        const term = searchTerm.toLowerCase();
        
        orcamentos.forEach(item => {
            const cliente = item.querySelector('.orcamento-cliente').textContent.toLowerCase();
            const descricao = item.querySelector('.orcamento-descricao').textContent.toLowerCase();
            const numero = item.querySelector('.orcamento-code').textContent.toLowerCase();
            
            if(cliente.includes(term) || descricao.includes(term) || numero.includes(term)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    filterByStatus: function(status) {
        if(!status) {
            document.querySelectorAll('.orcamento-item').forEach(item => {
                item.style.display = '';
            });
            return;
        }
        
        document.querySelectorAll('.orcamento-item').forEach(item => {
            if(item.classList.contains(status)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    filterByDate: function(date) {
        if(!date) {
            document.querySelectorAll('.orcamento-item').forEach(item => {
                item.style.display = '';
            });
            return;
        }
        
        const filterDate = new Date(date);
        
        document.querySelectorAll('.orcamento-item').forEach(item => {
            const itemDate = new Date(item.dataset.data);
            if(itemDate.toDateString() === filterDate.toDateString()) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    clearFilters: function() {
        document.getElementById('search-orcamento').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-date').value = '';
        
        document.querySelectorAll('.orcamento-item').forEach(item => {
            item.style.display = '';
        });
    },
    
    renderOrcamentosList: function() {
        const container = document.getElementById('orcamentos-list');
        container.innerHTML = '';
        
        // Ordena por data (mais recente primeiro)
        const orcamentos = [...IzakGestao.data.orcamentos].sort((a, b) => 
            new Date(b.dataCriacao) - new Date(a.dataCriacao)
        );
        
        if(orcamentos.length === 0) {
            container.innerHTML = '<p class="empty-orcamentos">Nenhum orçamento cadastrado.</p>';
            return;
        }
        
        orcamentos.forEach(orcamento => {
            const orcamentoElement = document.createElement('div');
            orcamentoElement.className = `orcamento-item ${orcamento.status}`;
            orcamentoElement.dataset.data = orcamento.dataCriacao;
            
            // Formata a data
            const data = new Date(orcamento.dataCriacao);
            const dataFormatada = data.toLocaleDateString('pt-BR');
            
            // Status badge
            const statusText = {
                'pendente': 'Pendente',
                'aprovado': 'Aprovado',
                'recusado': 'Recusado',
                'concluido': 'Concluído'
            }[orcamento.status] || 'Pendente';
            
            orcamentoElement.innerHTML = `
                <div class="orcamento-header">
                    <div class="orcamento-info">
                        <h3>${orcamento.numero} 
                            <span class="status-badge status-${orcamento.status}">${statusText}</span>
                        </h3>
                        <p class="orcamento-code">Criado em: ${dataFormatada}</p>
                        <p class="orcamento-cliente">Cliente: ${orcamento.cliente.nome}</p>
                        <p class="orcamento-descricao">${orcamento.descricao}</p>
                    </div>
                    <div class="orcamento-total">
                        <span class="valor-total">R$ ${orcamento.total.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="orcamento-details">
                    <div class="detail-item">
                        <span class="detail-label">Forma de Pagamento</span>
                        <span class="detail-value">${this.formatPagamento(orcamento.pagamento.forma)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Prazo de Entrega</span>
                        <span class="detail-value">${orcamento.pagamento.prazo} dias</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Itens</span>
                        <span class="detail-value">${orcamento.itens.length}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status</span>
                        <span class="detail-value status-${orcamento.status}">${statusText}</span>
                    </div>
                </div>
                
                <div class="orcamento-actions">
                    <button class="btn-edit" data-id="${orcamento.id}">Editar</button>
                    <button class="btn-delete" data-id="${orcamento.id}">Excluir</button>
                    <button class="btn-primary" onclick="OrcamentosModule.imprimirOrcamento('${orcamento.id}')">Imprimir</button>
                </div>
            `;
            
            container.appendChild(orcamentoElement);
        });
        
        // Adiciona eventos aos botões
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const orcamento = IzakGestao.data.orcamentos.find(o => o.id === id);
                this.showOrcamentoForm(orcamento);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                this.deleteOrcamento(id);
            });
        });
    },
    
    formatPagamento: function(forma) {
        const formas = {
            'dinheiro': 'Dinheiro',
            'pix': 'PIX',
            'cartao_debito': 'Cartão de Débito',
            'cartao_credito': 'Cartão de Crédito',
            'boleto': 'Boleto',
            'transferencia': 'Transferência'
        };
        return formas[forma] || forma;
    },
    
    imprimirOrcamento: function(id) {
        const orcamento = IzakGestao.data.orcamentos.find(o => o.id === id);
        if(!orcamento) return;
        
        // Cria uma nova janela para impressão
        const printWindow = window.open('', '_blank');
        
        // Conteúdo HTML para impressão
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Orçamento ${orcamento.numero}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #0055A4; }
                    .info { margin-bottom: 20px; }
                    .info p { margin: 5px 0; }
                    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .items-table th { background-color: #f2f2f2; }
                    .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; }
                    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Izak Comunicação Visual</h1>
                    <h2>Orçamento ${orcamento.numero}</h2>
                </div>
                
                <div class="info">
                    <p><strong>Data:</strong> ${new Date(orcamento.dataCriacao).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Cliente:</strong> ${orcamento.cliente.nome}</p>
                    <p><strong>Telefone:</strong> ${orcamento.cliente.telefone || 'Não informado'}</p>
                    <p><strong>E-mail:</strong> ${orcamento.cliente.email || 'Não informado'}</p>
                    <p><strong>Descrição:</strong> ${orcamento.descricao}</p>
                </div>
                
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th>Quantidade</th>
                            <th>Valor Unitário</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orcamento.itens.map(item => `
                            <tr>
                                <td>${item.descricao}</td>
                                <td>${item.quantidade}</td>
                                <td>R$ ${item.valorUnitario.toFixed(2)}</td>
                                <td>R$ ${item.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="total">
                    <p>Subtotal: R$ ${orcamento.subtotal.toFixed(2)}</p>
                    <p>Desconto (${orcamento.desconto}%): R$ ${(orcamento.subtotal * (orcamento.desconto / 100)).toFixed(2)}</p>
                    <p><strong>Total: R$ ${orcamento.total.toFixed(2)}</strong></p>
                </div>
                
                <div class="info">
                    <p><strong>Forma de Pagamento:</strong> ${this.formatPagamento(orcamento.pagamento.forma)}</p>
                    <p><strong>Prazo de Entrega:</strong> ${orcamento.pagamento.prazo} dias</p>
                    <p><strong>Observações:</strong> ${orcamento.observacoes || 'Nenhuma'}</p>
                </div>
                
                <div class="footer">
                    <p>Izak Comunicação Visual - Sistema de Gestão</p>
                    <p>Este documento foi gerado automaticamente pelo sistema</p>
                </div>
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }
};