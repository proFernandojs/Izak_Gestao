// Módulo de Orçamentos
const OrcamentosModule = {
    initialized: false,
    currentTab: 0,
    tabs: ['cliente', 'itens', 'pagamento'],
    currentOrcamento: null,

    // Formata valores monetários em BRL
    formatCurrency: function(value) {
        const num = Number(value) || 0;
        try {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2
            }).format(num);
        } catch (err) {
            return `R$ ${num.toFixed(2)}`;
        }
    },

    // Converte texto monetário em número
    parseCurrencyText: function(text) {
        if(!text) return 0;
        return Number(text.replace(/[^0-9,-]/g, '').replace('.', '').replace(',', '.')) || 0;
    },

    getClienteById: function(id) {
        if(!id) return null;
        return (IzakGestao?.data?.clientes || []).find(c => c.id === id) || null;
    },

    findClienteByName: function(nome) {
        if(!nome) return null;
        const normalized = nome.toLowerCase();
        return (IzakGestao?.data?.clientes || []).find(c => (c.nome || '').toLowerCase() === normalized) || null;
    },
    
    init: function() {
        console.log('OrcamentosModule iniciando...');
        // Evita múltiplas inicializações que duplicam listeners e salvam em duplicidade
        if (this.initialized) {
            console.log('OrcamentosModule já inicializado, apenas atualizando lista');
            this.renderOrcamentosList();
            this.populateClientesSelect();
            this.updateClientesOrcamentos();
            return;
        }
        this.initialized = true;
        this.renderOrcamentosList();
        this.populateClientesSelect();
        this.updateClientesOrcamentos();
        this.bindEvents();
        this.initForm();
    },

    populateClientesSelect: function(selectedId = '') {
        const select = document.getElementById('cliente-select');
        if(!select) return;

        const clientes = [...(IzakGestao?.data?.clientes || [])].sort((a, b) =>
            (a.nome || '').localeCompare(b.nome || '')
        );

        select.innerHTML = '<option value="">Selecione um cliente existente...</option>';

        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            const telefone = cliente?.contato?.telefone || cliente?.contato?.celular || 'Sem telefone';
            option.textContent = `${cliente.nome} (${telefone})`;
            select.appendChild(option);
        });

        if(selectedId) {
            select.value = selectedId;
        }
    },
    
    bindEvents: function() {
        console.log('Binding events do OrcamentosModule...');
        // Botão para adicionar novo orçamento
        const addOrcamentoBtn = document.getElementById('add-orcamento-btn');
        console.log('Botão Novo Orçamento encontrado:', addOrcamentoBtn);
        if(addOrcamentoBtn) {
            addOrcamentoBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Previne propagação
                console.log('Clique no botão Novo Orçamento');
                this.showOrcamentoForm();
            });
        }

        const clienteSelect = document.getElementById('cliente-select');
        if(clienteSelect) {
            clienteSelect.addEventListener('change', (e) => {
                const cliente = this.getClienteById(e.target.value);
                this.handleClienteSelection(cliente);
            });
        }

        const clienteNomeInput = document.getElementById('cliente-nome');
        if(clienteNomeInput) {
            clienteNomeInput.addEventListener('input', () => {
                const hiddenId = document.getElementById('orcamento-cliente-id');
                if(hiddenId && !clienteNomeInput.value) {
                    hiddenId.value = '';
                }
            });
        }
        
        // Formulário de salvamento
        const orcamentoForm = document.getElementById('orcamento-form');
        if(orcamentoForm) {
            // Previne propagação de cliques no formulário
            orcamentoForm.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            orcamentoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.saveOrcamento();
            });
        }
        
        // Cancelar formulário
        const cancelBtn = document.getElementById('cancel-orcamento-btn');
        if(cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideOrcamentoForm();
            });
        }
        
        // Navegação entre abas
        const prevTabBtn = document.getElementById('prev-tab-btn');
        if(prevTabBtn) {
            prevTabBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.prevTab();
            });
        }
        
        const nextTabBtn = document.getElementById('next-tab-btn');
        if(nextTabBtn) {
            nextTabBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.nextTab();
            });
        }
        
        // Tabs do formulário
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tab = e.target.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });
        
        // Filtros
        const searchOrcamento = document.getElementById('search-orcamento');
        if(searchOrcamento) {
            searchOrcamento.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            searchOrcamento.addEventListener('input', (e) => {
                e.stopPropagation();
                this.filterOrcamentos(e.target.value);
            });
        }
        
        const filterStatus = document.getElementById('filter-status');
        if(filterStatus) {
            filterStatus.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            filterStatus.addEventListener('change', (e) => {
                e.stopPropagation();
                this.filterByStatus(e.target.value);
            });
        }
        
        const filterDate = document.getElementById('filter-date');
        if(filterDate) {
            filterDate.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            filterDate.addEventListener('change', (e) => {
                e.stopPropagation();
                this.filterByDate(e.target.value);
            });
        }
        
        const clearFilters = document.getElementById('clear-filters');
        if(clearFilters) {
            clearFilters.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearFilters();
            });
        }
        
        // Adicionar item no orçamento - será vinculado dinamicamente
        // quando o formulário for mostrado
        
        // Desconto
        const desconto = document.getElementById('desconto');
        if(desconto) {
            desconto.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            desconto.addEventListener('input', (e) => {
                e.stopPropagation();
                this.calcularTotal();
            });
        }

        // Mostrar/ocultar gerador de boleto conforme forma de pagamento
        const forma = document.getElementById('forma-pagamento');
        if (forma) {
            forma.addEventListener('change', () => {
                this.toggleBoletoUI(forma.value);
            });
            // Inicializa estado
            this.toggleBoletoUI(forma.value);
        }

        // Emissão de boleto diretamente do formulário de orçamento (teste/mock)
        const emitirBtn = document.getElementById('emitir-boleto-btn');
        if (emitirBtn) {
            emitirBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    const result = await this.emitirBoletoFromForm();
                    const out = document.getElementById('boleto-result');
                    if (out) {
                        out.innerHTML = `Linha digitável: <strong>${result.linhaDigitavel}</strong><br/>` +
                            (result.pdfUrl ? `<a href="${result.pdfUrl}" target="_blank">Abrir PDF</a>` : '');
                    }
                    alert('Boleto emitido!');
                } catch (err) {
                    alert('Falha ao emitir boleto: ' + (err?.message || err));
                }
            });
        }
    },

    toggleBoletoUI: function(forma) {
        const box = document.getElementById('boleto-actions');
        if (!box) return;
        if (forma === 'boleto') {
            box.classList.remove('hidden');
            // Default vencimento +7 dias
            const v = document.getElementById('boleto-vencimento');
            if (v && !v.value) {
                const d = new Date();
                d.setDate(d.getDate() + 7);
                v.value = d.toISOString().split('T')[0];
            }
        } else {
            box.classList.add('hidden');
        }
    },

    emitirBoletoFromForm: async function() {
        if (typeof BoletoService === 'undefined') throw new Error('BoletoService indisponível');
        // Monta pagador a partir dos campos do formulário
        const nome = document.getElementById('cliente-nome')?.value || '';
        const email = document.getElementById('cliente-email')?.value || '';
        const telefone = document.getElementById('cliente-telefone')?.value || '';
        // Tenta buscar CPF/CNPJ do cliente salvo
        let documento = '';
        const cid = document.getElementById('orcamento-cliente-id')?.value || '';
        if (cid) {
            const cli = (IzakGestao?.data?.clientes || []).find(c => c.id === cid);
            documento = (cli?.documento || '').replace(/\D/g, '');
        } else {
            const nm = (nome || '').toLowerCase();
            const cli = (IzakGestao?.data?.clientes || []).find(c => (c.nome || '').toLowerCase() === nm);
            documento = (cli?.documento || '').replace(/\D/g, '');
        }
        if (!documento) throw new Error('Cadastre o CPF/CNPJ do cliente em Clientes para emitir boleto.');

        // Valor total atual
        const totalText = document.getElementById('total')?.textContent || 'R$ 0,00';
        const valor = this.parseCurrencyText(totalText);
        // Vencimento e instruções
        const vencimento = document.getElementById('boleto-vencimento')?.value || new Date().toISOString().split('T')[0];
        const instrucoes = document.getElementById('boleto-instrucoes')?.value || 'Não receber após 30 dias. Juros 1% a.m.';

        const pagador = { nome, documento, email, telefone };
        const ref = this.currentOrcamento?.numero || this.generateOrcamentoNumero();
        const boleto = await BoletoService.emitir({ valor, vencimento, pagador, instrucoes, referencia: ref });
        return boleto;
    },
    
    attachAddItemButton: function() {
        // Vincula o botão de adicionar item - chamado quando o formulário é mostrado
        console.log('Iniciando attachAddItemButton');
        const addItemBtn = document.getElementById('add-orcamento-item-btn');
        console.log('add-orcamento-item-btn encontrado:', addItemBtn !== null);
        
        if(!addItemBtn) {
            console.error('Botão add-orcamento-item-btn NÃO encontrado no DOM');
            return;
        }
        
        // Remove todos os listeners antigos clonando o botão
        const newBtn = addItemBtn.cloneNode(true);
        if(addItemBtn.parentNode) {
            addItemBtn.parentNode.replaceChild(newBtn, addItemBtn);
        } else {
            console.error('Pai do botão não encontrado');
            return;
        }
        
        // Adiciona o novo listener mantendo o contexto com arrow function
        newBtn.addEventListener('click', (e) => {
            console.log('>>> Clique detectado no botão adicionar item');
            e.preventDefault();
            e.stopPropagation();
            console.log('>>> Chamando addItemRow() - contexto:', this);
            console.log('>>> Número de itens antes de adicionar:', document.querySelectorAll('.item-row').length);
            try {
                this.addItemRow();
                console.log('>>> addItemRow() executado com sucesso');
                // Força uma verificação após adicionar
                setTimeout(() => {
                    console.log('>>> Número de itens após adicionar:', document.querySelectorAll('.item-row').length);
                    const itensList = document.getElementById('itens-list');
                    console.log('>>> Conteúdo do itens-list:', itensList ? itensList.innerHTML.substring(0, 200) : 'null');
                }, 100);
            } catch(error) {
                console.error('>>> Erro ao executar addItemRow():', error);
            }
        });
        
        console.log('Listener de adicionar item vinculado com sucesso');
    },

    handleClienteSelection: function(cliente) {
        const hiddenId = document.getElementById('orcamento-cliente-id');
        if(hiddenId) {
            hiddenId.value = cliente ? cliente.id : '';
        }

        if(!cliente) return;

        const telefone = cliente?.contato?.telefone || cliente?.contato?.celular || '';
        const email = cliente?.contato?.email || '';

        const nomeInput = document.getElementById('cliente-nome');
        const telefoneInput = document.getElementById('cliente-telefone');
        const emailInput = document.getElementById('cliente-email');

        if(nomeInput) nomeInput.value = cliente.nome || '';
        if(telefoneInput) telefoneInput.value = telefone;
        if(emailInput) emailInput.value = email;
    },
    
    showOrcamentoForm: function(orcamento = null) {
        console.log('showOrcamentoForm chamado', orcamento ? 'edição' : 'criação');
        this.currentOrcamento = orcamento;
        this.currentTab = 0;
        
        const form = document.getElementById('orcamento-form');
        form.reset();

        const hiddenClienteId = document.getElementById('orcamento-cliente-id');
        if(hiddenClienteId) hiddenClienteId.value = '';
        this.populateClientesSelect();
        const clienteSelect = document.getElementById('cliente-select');
        if(clienteSelect) clienteSelect.value = '';
        
        // Limpa TODOS os itens existentes antes de abrir o formulário
        const itensList = document.getElementById('itens-list');
        if(itensList) {
            itensList.innerHTML = '';
            console.log('Lista de itens limpa');
        }
        
        if(orcamento) {
            // Modo edição
            console.log('Modo edição - carregando orçamento');
            form.dataset.id = orcamento.id;
            const clienteId = orcamento.clienteId || this.findClienteByName(orcamento?.cliente?.nome)?.id || '';
            this.populateClientesSelect(clienteId);
            if(hiddenClienteId) hiddenClienteId.value = clienteId || '';

            document.getElementById('cliente-nome').value = orcamento.cliente.nome;
            document.getElementById('cliente-telefone').value = orcamento.cliente.telefone || '';
            document.getElementById('cliente-email').value = orcamento.cliente.email || '';
            document.getElementById('cliente-descricao').value = orcamento.descricao;

            if(clienteId) {
                const cliente = this.getClienteById(clienteId);
                if(cliente) {
                    this.handleClienteSelection(cliente);
                    if(clienteSelect) clienteSelect.value = clienteId;
                }
            }
            
            // Carrega itens do orçamento
            this.loadItens(orcamento.itens);
            
            document.getElementById('forma-pagamento').value = orcamento.pagamento.forma;
            document.getElementById('prazo-entrega').value = orcamento.pagamento.prazo;
            document.getElementById('observacoes').value = orcamento.observacoes || '';
            document.getElementById('orcamento-status').value = orcamento.status;
            
            document.getElementById('orcamento-form-title').textContent = 'Editar Orçamento';
        } else {
            // Modo criação - adiciona um item inicial vazio
            console.log('Modo criação - adicionando item inicial');
            form.removeAttribute('data-id');
            this.populateClientesSelect();
            
            // Reseta os campos de totais
            document.getElementById('desconto').value = '0';
            
            // Adiciona um item vazio inicial
            this.addItemRow();
            document.getElementById('orcamento-form-title').textContent = 'Novo Orçamento';
        }
        
        this.switchTab('cliente');
        
        // Recalcula totais (vai zerar ou calcular baseado nos itens carregados)
        setTimeout(() => {
            this.calcularTotal();
        }, 100);
        
        // Mostra o formulário ANTES de vincular o botão
        document.getElementById('orcamento-form-container').classList.remove('hidden');
        document.getElementById('orcamentos-list-container').classList.add('hidden');
        
        // Vincula o botão de adicionar item APÓS o formulário estar visível no DOM
        setTimeout(() => {
            console.log('Vinculando botão de adicionar item após formulário estar visível');
            this.attachAddItemButton();
        }, 150);
    },
    
    hideOrcamentoForm: function() {
        document.getElementById('orcamento-form-container').classList.add('hidden');
        document.getElementById('orcamentos-list-container').classList.remove('hidden');
    },
    
    initForm: function() {
        // Inicialização do formulário - agora vinculado em showOrcamentoForm
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
        
        // Re-vincula botão adicionar item quando mudar para aba itens
        if(tabName === 'itens') {
            console.log('>>> Mudou para aba itens, vinculando botão...');
            setTimeout(() => {
                this.attachAddItemButton();
            }, 200);
        }
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
        console.log('>>> addItemRow chamado, item:', item);
        const itensList = document.getElementById('itens-list');
        console.log('>>> itens-list encontrado:', itensList !== null);
        
        if(!itensList) {
            console.error('>>> Container itens-list não encontrado');
            alert('Erro: Container de itens não encontrado. Tente novamente.');
            return;
        }
        
        const itemId = Date.now() + Math.random().toString(36).substr(2, 9);
        console.log('>>> Criando item com ID:', itemId);
        
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
        
        console.log('>>> Adicionando item ao container');
        itensList.appendChild(itemRow);
        console.log('>>> Item adicionado ao DOM');
        
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
        const removeBtn = itemRow.querySelector('.remove-item');
        if(removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                itemRow.remove();
                this.calcularTotal();
            });
        }
        
        // Calcular total inicial
        calcularItemTotal();
        console.log('>>> Item criado e configurado com sucesso:', itemId);
    },
    
    loadItens: function(itens) {
        console.log('loadItens chamado com:', itens ? itens.length : 0, 'itens');
        const itensList = document.getElementById('itens-list');
        if(!itensList) {
            console.error('itens-list não encontrado em loadItens');
            return;
        }
        
        // Limpa completamente a lista
        itensList.innerHTML = '';
        console.log('Lista de itens limpa em loadItens');
        
        if(itens && itens.length > 0) {
            console.log('Carregando', itens.length, 'itens existentes');
            itens.forEach(item => {
                this.addItemRow(item);
            });
        } else {
            console.log('Nenhum item para carregar, adicionando item vazio');
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
        
        document.getElementById('subtotal').textContent = this.formatCurrency(subtotal);
        document.getElementById('valor-desconto').textContent = this.formatCurrency(descontoValor);
        document.getElementById('total').textContent = this.formatCurrency(total);
    },
    
    saveOrcamento: async function() {
        const form = document.getElementById('orcamento-form');
        const clienteId = (document.getElementById('orcamento-cliente-id')?.value || '').trim();
        
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
            clienteId: clienteId || null,
            cliente: {
                nome: document.getElementById('cliente-nome').value,
                telefone: document.getElementById('cliente-telefone').value,
                email: document.getElementById('cliente-email').value
            },
            descricao: document.getElementById('cliente-descricao').value,
            itens: itens,
            subtotal: this.parseCurrencyText(document.getElementById('subtotal').textContent),
            desconto: parseFloat(document.getElementById('desconto').value) || 0,
            total: this.parseCurrencyText(document.getElementById('total').textContent),
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

        this.updateClientesOrcamentos();
        IzakGestao.saveData();
        this.renderOrcamentosList();
        this.hideOrcamentoForm();
        
        // Atualiza dashboard
        IzakGestao.updateDashboard();

        // Se forma de pagamento for boleto, cria conta a receber e emite boleto
        try {
            if (orcamento.pagamento?.forma === 'boleto') {
                // Vencimento padrão: hoje + 7 dias
                const venc = new Date();
                venc.setDate(venc.getDate() + 7);
                const vencStr = venc.toISOString().split('T')[0];

                const conta = {
                    id: `CR-${Date.now()}`,
                    descricao: `Orçamento ${orcamento.numero}`,
                    categoria: 'Vendas',
                    valor: orcamento.total,
                    vencimento: vencStr,
                    dataPagamento: null,
                    clienteFornecedor: orcamento.cliente?.nome || 'Cliente',
                    status: 'pendente',
                    observacoes: `Gerada a partir do orçamento ${orcamento.numero}`,
                    dataCriacao: new Date().toISOString(),
                    dataAtualizacao: new Date().toISOString()
                };

                IzakGestao.data.financeiro.contasReceber.push(conta);
                IzakGestao.saveData();

                // Emissão automática do boleto (se possível)
                if (typeof BoletoService !== 'undefined') {
                    // Buscar cliente para obter documento
                    let cliente = null;
                    if (orcamento.clienteId) {
                        cliente = (IzakGestao?.data?.clientes || []).find(c => c.id === orcamento.clienteId) || null;
                    } else if (orcamento.cliente?.nome) {
                        const nm = (orcamento.cliente.nome || '').toLowerCase();
                        cliente = (IzakGestao?.data?.clientes || []).find(c => (c.nome || '').toLowerCase() === nm) || null;
                    }

                    if (cliente && cliente.documento) {
                        const pagador = {
                            nome: cliente.nome,
                            documento: (cliente.documento || '').replace(/\D/g, ''),
                            email: cliente?.contato?.email || orcamento.cliente?.email || '',
                            telefone: cliente?.contato?.telefone || cliente?.contato?.celular || orcamento.cliente?.telefone || '',
                            endereco: cliente?.endereco || {}
                        };
                        try {
                            const boleto = await BoletoService.emitir({
                                valor: conta.valor,
                                vencimento: conta.vencimento,
                                pagador,
                                instrucoes: 'Não receber após 30 dias. Juros 1% a.m.',
                                referencia: orcamento.numero
                            });
                            conta.boleto = {
                                id: boleto.id,
                                status: boleto.status,
                                linhaDigitavel: boleto.linhaDigitavel,
                                pdfUrl: boleto.pdfUrl,
                                provider: boleto.provider,
                                emitidoEm: boleto.createdAt
                            };
                            // Persistir atualização
                            const idx = IzakGestao.data.financeiro.contasReceber.findIndex(c => c.id === conta.id);
                            if (idx >= 0) IzakGestao.data.financeiro.contasReceber[idx] = conta;
                            IzakGestao.saveData();
                            alert('Boleto emitido para este orçamento.');
                        } catch (err) {
                            console.warn('Falha ao emitir boleto a partir do orçamento:', err);
                        }
                    } else {
                        alert('Para emitir boleto, cadastre o CPF/CNPJ do cliente em Clientes.');
                    }
                }
            }
        } catch (e) {
            console.warn('Erro no fluxo de boleto do orçamento:', e);
        }
    },

    updateClientesOrcamentos: function() {
        if(!IzakGestao?.data?.clientes) return;
        const orcamentos = IzakGestao.data.orcamentos || [];

        IzakGestao.data.clientes.forEach(cliente => {
            const matchCount = orcamentos.filter(o => {
                const sameId = o?.clienteId && o.clienteId === cliente.id;
                const sameName = !o?.clienteId && o?.cliente?.nome && (o.cliente.nome || '').toLowerCase() === (cliente.nome || '').toLowerCase();
                return sameId || sameName;
            }).length;

            cliente.totalOrcamentos = matchCount;
            if(typeof cliente.totalCompras === 'undefined') {
                cliente.totalCompras = 0;
            }
        });

        if(typeof ClientesModule !== 'undefined') {
            try {
                ClientesModule.renderClientesList();
                ClientesModule.updateStats();
            } catch (e) {
                console.warn('Falha ao atualizar UI de clientes:', e);
            }
        }
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
            this.updateClientesOrcamentos();
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
        console.log('renderOrcamentosList chamado');
        const container = document.getElementById('orcamentos-list');
        if(!container) {
            console.error('Container orcamentos-list não encontrado');
            return;
        }
        console.log('Container encontrado:', container);
        container.innerHTML = '';
        
        // Ordena por data (mais recente primeiro)
        const orcamentos = [...IzakGestao.data.orcamentos].sort((a, b) => 
            new Date(b.dataCriacao) - new Date(a.dataCriacao)
        );
        
        console.log('Total de orçamentos:', orcamentos.length);
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
                        <span class="valor-total">${this.formatCurrency(orcamento.total)}</span>
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
                                <td>${this.formatCurrency(item.valorUnitario)}</td>
                                <td>${this.formatCurrency(item.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="total">
                    <p>Subtotal: ${this.formatCurrency(orcamento.subtotal)}</p>
                    <p>Desconto (${orcamento.desconto}%): ${this.formatCurrency(orcamento.subtotal * (orcamento.desconto / 100))}</p>
                    <p><strong>Total: ${this.formatCurrency(orcamento.total)}</strong></p>
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