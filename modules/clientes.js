// Módulo de Clientes
const ClientesModule = {
    currentTab: 0,
    tabs: ['dados', 'endereco', 'contato'],
    currentCliente: null,
    eventsInitialized: false,
    
    // Helper para obter elemento com segurança
    getElement: function(id) {
        return document.getElementById(id);
    },
    
    init: function() {
        this.renderClientesList();
        if(!this.eventsInitialized) {
            this.bindEvents();
            this.eventsInitialized = true;
        }
        this.updateStats();
    },
    
    bindEvents: function() {
        // Botão para adicionar novo cliente
        const addBtn = document.getElementById('add-cliente-btn');
        if(addBtn) {
            addBtn.addEventListener('click', () => {
                this.showClienteForm();
            });
        }
        
        // Formulário de salvamento
        const form = document.getElementById('cliente-form');
        if(form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCliente();
            });
        }
        
        // Cancelar formulário
        const cancelBtn = document.getElementById('cancel-cliente-btn');
        if(cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideClienteForm();
            });
        }
        
        // Navegação entre abas
        const prevBtn = document.getElementById('prev-tab-cliente-btn');
        if(prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.prevTab();
            });
        }
        
        const nextBtn = document.getElementById('next-tab-cliente-btn');
        if(nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextTab();
            });
        }
        
        // Tabs do formulário
        document.querySelectorAll('[data-tab]').forEach(btn => {
            // Evita múltiplos listeners se init rodar mais de uma vez
            btn.removeEventListener('click', this._tabHandler);
            this._tabHandler = (e) => {
                const tab = e.target.getAttribute('data-tab');
                this.switchTab(tab);
            };
            btn.addEventListener('click', this._tabHandler);
        });
        
        // Filtros
        const searchInput = document.getElementById('search-cliente');
        const searchBtn = document.getElementById('search-cliente-btn');
        if(searchInput) {
            searchInput.removeEventListener('input', this._searchInputHandler);
            this._searchInputHandler = (e) => this.applyFilters(e.target.value);
            searchInput.addEventListener('input', this._searchInputHandler);

            searchInput.removeEventListener('keydown', this._searchKeyHandler);
            this._searchKeyHandler = (e) => {
                if(e.key === 'Enter') {
                    e.preventDefault();
                    this.applyFilters(searchInput.value);
                }
            };
            searchInput.addEventListener('keydown', this._searchKeyHandler);
        }
        if(searchBtn && searchInput) {
            searchBtn.removeEventListener('click', this._searchClickHandler);
            this._searchClickHandler = () => this.applyFilters(searchInput.value);
            searchBtn.addEventListener('click', this._searchClickHandler);
        }
        
        const filterTipo = document.getElementById('filter-tipo');
        if(filterTipo) {
            filterTipo.addEventListener('change', (e) => {
                this.filterByTipo(e.target.value);
            });
        }
        
        const filterStatus = document.getElementById('filter-status-clientes');
        if(filterStatus) {
            filterStatus.addEventListener('change', (e) => {
                this.filterByStatus(e.target.value);
            });
        }
        
        const clearBtn = document.getElementById('clear-filters-cliente');
        if(clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }
        
        // Tipo de cliente
        const tipoCliente = document.getElementById('tipo-cliente');
        if(tipoCliente) {
            tipoCliente.addEventListener('change', (e) => {
                this.handleTipoChange(e.target.value);
            });
        }
        
        // Buscar CEP
        const buscarCepBtn = document.getElementById('buscar-cep');
        if(buscarCepBtn) {
            buscarCepBtn.addEventListener('click', () => {
                this.buscarCEP();
            });
        }
        
        const cepInput = document.getElementById('cep');
        if(cepInput) {
            cepInput.addEventListener('blur', () => {
                this.buscarCEP();
            });
            cepInput.addEventListener('input', (e) => {
                this.formatCEP(e.target);
            });
        }
        
        // Máscaras nos campos
        const documentoInput = document.getElementById('documento-cliente');
        if(documentoInput) {
            documentoInput.addEventListener('input', (e) => {
                this.formatDocumento(e.target);
            });
        }
        
        const telefoneInput = document.getElementById('telefone');
        if(telefoneInput) {
            telefoneInput.addEventListener('input', (e) => {
                this.formatTelefone(e.target);
            });
        }
        
        const celularInput = document.getElementById('celular');
        if(celularInput) {
            celularInput.addEventListener('input', (e) => {
                this.formatTelefone(e.target, true);
            });
        }
    },
    
    showClienteForm: function(cliente = null) {
        this.currentCliente = cliente;
        this.currentTab = 0;
        
        const form = this.getElement('cliente-form');
        if(!form) return;
        form.reset();
        
        // Reseta campos específicos se existirem
        const dadosPF = this.getElement('dados-pf');
        const dadosPJ = this.getElement('dados-pj');
        const labelNome = this.getElement('label-nome');
        const labelDoc = this.getElement('label-documento');
        
        if(dadosPF) dadosPF.classList.add('hidden');
        if(dadosPJ) dadosPJ.classList.add('hidden');
        if(labelNome) labelNome.textContent = 'Nome/Razão Social*';
        if(labelDoc) labelDoc.textContent = 'CPF/CNPJ*';
        
        if(cliente) {
            // Modo edição
            form.dataset.id = cliente.id;
            const tipoElem = this.getElement('tipo-cliente');
            const nomeElem = this.getElement('nome-cliente');
            const docElem = this.getElement('documento-cliente');
            const statusElem = this.getElement('cliente-status');
            
            if(tipoElem) tipoElem.value = cliente.tipo;
            if(nomeElem) nomeElem.value = cliente.nome;
            if(docElem) docElem.value = cliente.documento;
            if(statusElem) statusElem.value = cliente.status;
            
            // Mostra campos específicos do tipo
            if(tipoElem) this.handleTipoChange(cliente.tipo);
            
            if(cliente.tipo === 'pf') {
                const rgElem = this.getElement('rg-cliente');
                const dataNascElem = this.getElement('data-nascimento');
                if(rgElem) rgElem.value = cliente.rg || '';
                if(dataNascElem) dataNascElem.value = cliente.dataNascimento || '';
            } else if(cliente.tipo === 'pj') {
                const nomeFantElem = this.getElement('nome-fantasia');
                const inscElem = this.getElement('inscricao-estadual');
                if(nomeFantElem) nomeFantElem.value = cliente.nomeFantasia || '';
                if(inscElem) inscElem.value = cliente.inscricaoEstadual || '';
            }
            
            // Endereço
            if(cliente.endereco) {
                const cepElem = this.getElement('cep');
                const logElem = this.getElement('logradouro');
                const numElem = this.getElement('numero');
                const compElem = this.getElement('complemento');
                const bairElem = this.getElement('bairro');
                const cidElem = this.getElement('cidade');
                const estElem = this.getElement('estado');
                
                if(cepElem) cepElem.value = cliente.endereco.cep || '';
                if(logElem) logElem.value = cliente.endereco.logradouro || '';
                if(numElem) numElem.value = cliente.endereco.numero || '';
                if(compElem) compElem.value = cliente.endereco.complemento || '';
                if(bairElem) bairElem.value = cliente.endereco.bairro || '';
                if(cidElem) cidElem.value = cliente.endereco.cidade || '';
                if(estElem) estElem.value = cliente.endereco.estado || '';
            }
            
            // Contato
            if(cliente.contato) {
                const telElem = this.getElement('telefone');
                const celElem = this.getElement('celular');
                const emailElem = this.getElement('email');
                const siteElem = this.getElement('site');
                
                if(telElem) telElem.value = cliente.contato.telefone || '';
                if(celElem) celElem.value = cliente.contato.celular || '';
                if(emailElem) emailElem.value = cliente.contato.email || '';
                if(siteElem) siteElem.value = cliente.contato.site || '';
            }
            
            const obsElem = this.getElement('observacoes-cliente');
            if(obsElem) obsElem.value = cliente.observacoes || '';
            
            const titleElem = this.getElement('cliente-form-title');
            if(titleElem) titleElem.textContent = 'Editar Cliente';
        } else {
            // Modo criação
            form.removeAttribute('data-id');
            const titleElem = this.getElement('cliente-form-title');
            if(titleElem) titleElem.textContent = 'Novo Cliente';
        }
        
        this.switchTab('dados');
        const formContainer = this.getElement('cliente-form-container');
        const listContainer = this.getElement('clientes-list-container');
        if(formContainer) formContainer.classList.remove('hidden');
        if(listContainer) listContainer.classList.add('hidden');
    },
    
    hideClienteForm: function() {
        const formContainer = this.getElement('cliente-form-container');
        const listContainer = this.getElement('clientes-list-container');
        if(formContainer) formContainer.classList.add('hidden');
        if(listContainer) listContainer.classList.remove('hidden');
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
        const prevBtn = this.getElement('prev-tab-cliente-btn');
        const nextBtn = this.getElement('next-tab-cliente-btn');
        const submitBtn = this.getElement('submit-cliente-btn');
        
        if(prevBtn) {
            if(this.currentTab === 0) {
                prevBtn.classList.add('hidden');
            } else {
                prevBtn.classList.remove('hidden');
            }
        }
        
        if(nextBtn && submitBtn) {
            if(this.currentTab === this.tabs.length - 1) {
                nextBtn.classList.add('hidden');
                submitBtn.classList.remove('hidden');
            } else {
                nextBtn.classList.remove('hidden');
                submitBtn.classList.add('hidden');
            }
        }
    },
    
    handleTipoChange: function(tipo) {
        const dadosPF = this.getElement('dados-pf');
        const dadosPJ = this.getElement('dados-pj');
        const labelNome = this.getElement('label-nome');
        const labelDocumento = this.getElement('label-documento');
        const docInput = this.getElement('documento-cliente');
        
        if(tipo === 'pf') {
            if(dadosPF) dadosPF.classList.remove('hidden');
            if(dadosPJ) dadosPJ.classList.add('hidden');
            if(labelNome) labelNome.textContent = 'Nome Completo*';
            if(labelDocumento) labelDocumento.textContent = 'CPF*';
            if(docInput) this.formatDocumento(docInput);
        } else if(tipo === 'pj') {
            if(dadosPF) dadosPF.classList.add('hidden');
            if(dadosPJ) dadosPJ.classList.remove('hidden');
            if(labelNome) labelNome.textContent = 'Razão Social*';
            if(labelDocumento) labelDocumento.textContent = 'CNPJ*';
            if(docInput) this.formatDocumento(docInput);
        } else {
            if(dadosPF) dadosPF.classList.add('hidden');
            if(dadosPJ) dadosPJ.classList.add('hidden');
            if(labelNome) labelNome.textContent = 'Nome/Razão Social*';
            if(labelDocumento) labelDocumento.textContent = 'CPF/CNPJ*';
        }
    },
    
    formatDocumento: function(input) {
        let value = input.value.replace(/\D/g, '');
        const tipo = document.getElementById('tipo-cliente').value;
        
        if(tipo === 'pf') {
            // Formata CPF: 000.000.000-00
            if(value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            }
        } else if(tipo === 'pj') {
            // Formata CNPJ: 00.000.000/0000-00
            if(value.length <= 14) {
                value = value.replace(/^(\d{2})(\d)/, '$1.$2');
                value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
                value = value.replace(/(\d{4})(\d)/, '$1-$2');
            }
        }
        
        input.value = value;
    },
    
    formatTelefone: function(input, isCelular = false) {
        let value = input.value.replace(/\D/g, '');
        
        if(isCelular && value.length <= 11) {
            // Formata celular: (00) 00000-0000
            value = value.replace(/^(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
        } else if(value.length <= 10) {
            // Formata telefone fixo: (00) 0000-0000
            value = value.replace(/^(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
        }
        
        input.value = value;
    },
    
    formatCEP: function(input) {
        let value = input.value.replace(/\D/g, '');
        
        // Formata CEP: 00000-000
        if(value.length <= 8) {
            value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        }
        
        input.value = value;
    },
    
    buscarCEP: function() {
        const cepInput = document.getElementById('cep');
        let cep = cepInput.value.replace(/\D/g, '');
        
        if(cep.length !== 8) {
            alert('CEP inválido! Digite 8 números.');
            return;
        }
        
        // Mostra loading
        const buscarBtn = document.getElementById('buscar-cep');
        const originalText = buscarBtn.textContent;
        buscarBtn.textContent = 'Buscando...';
        buscarBtn.disabled = true;
        
        // Consulta a API ViaCEP
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(response => response.json())
            .then(data => {
                if(data.erro) {
                    alert('CEP não encontrado!');
                    return;
                }
                
                // Preenche os campos
                document.getElementById('logradouro').value = data.logradouro || '';
                document.getElementById('bairro').value = data.bairro || '';
                document.getElementById('cidade').value = data.localidade || '';
                document.getElementById('estado').value = data.uf || '';
                
                // Foca no campo número
                document.getElementById('numero').focus();
            })
            .catch(error => {
                console.error('Erro ao buscar CEP:', error);
                alert('Erro ao buscar CEP. Verifique sua conexão.');
            })
            .finally(() => {
                buscarBtn.textContent = originalText;
                buscarBtn.disabled = false;
            });
    },
    
    saveCliente: function() {
        const form = document.getElementById('cliente-form');
        const tipo = document.getElementById('tipo-cliente').value;
        
        // Valida CPF/CNPJ
        const documento = document.getElementById('documento-cliente').value.replace(/\D/g, '');
        if(!this.validarDocumento(documento, tipo)) {
            alert(tipo === 'pf' ? 'CPF inválido!' : 'CNPJ inválido!');
            this.switchTab('dados');
            return;
        }
        
        // Valida e-mail
        const email = document.getElementById('email').value;
        if(email && !this.validarEmail(email)) {
            alert('E-mail inválido!');
            this.switchTab('contato');
            return;
        }
        
        const cliente = {
            id: form.dataset.id || Date.now().toString(),
            tipo: tipo,
            nome: document.getElementById('nome-cliente').value,
            documento: documento,
            status: document.getElementById('cliente-status').value,
            dataCadastro: form.dataset.id ? this.currentCliente.dataCadastro : new Date().toISOString(),
            dataAtualizacao: new Date().toISOString(),
            endereco: {
                cep: document.getElementById('cep').value,
                logradouro: document.getElementById('logradouro').value,
                numero: document.getElementById('numero').value,
                complemento: document.getElementById('complemento').value,
                bairro: document.getElementById('bairro').value,
                cidade: document.getElementById('cidade').value,
                estado: document.getElementById('estado').value
            },
            contato: {
                telefone: document.getElementById('telefone').value,
                celular: document.getElementById('celular').value,
                email: document.getElementById('email').value,
                site: document.getElementById('site').value
            },
            observacoes: document.getElementById('observacoes-cliente').value
        };
        
        // Adiciona campos específicos do tipo
        if(tipo === 'pf') {
            cliente.rg = document.getElementById('rg-cliente').value;
            cliente.dataNascimento = document.getElementById('data-nascimento').value;
        } else if(tipo === 'pj') {
            cliente.nomeFantasia = document.getElementById('nome-fantasia').value;
            cliente.inscricaoEstadual = document.getElementById('inscricao-estadual').value;
        }
        
        // Calcula total de orçamentos para este cliente
        if(!form.dataset.id) {
            cliente.totalOrcamentos = 0;
            cliente.totalCompras = 0;
        } else {
            cliente.totalOrcamentos = this.currentCliente.totalOrcamentos || 0;
            cliente.totalCompras = this.currentCliente.totalCompras || 0;
        }
        
        // Atualiza ou adiciona o cliente
        const index = IzakGestao.data.clientes.findIndex(c => c.id === cliente.id);
        if(index >= 0) {
            IzakGestao.data.clientes[index] = cliente;
        } else {
            IzakGestao.data.clientes.push(cliente);
        }
        
        IzakGestao.saveData();
        this.renderClientesList();
        this.updateStats();
        this.hideClienteForm();
    },
    
    validarDocumento: function(documento, tipo) {
        if(tipo === 'pf') {
            return this.validarCPF(documento);
        } else if(tipo === 'pj') {
            return this.validarCNPJ(documento);
        }
        return false;
    },
    
    validarCPF: function(cpf) {
        cpf = cpf.replace(/\D/g, '');
        
        if(cpf.length !== 11) return false;
        
        // Elimina CPFs inválidos conhecidos
        if(/^(\d)\1+$/.test(cpf)) return false;
        
        // Validação do dígito verificador
        let soma = 0;
        let resto;
        
        for(let i = 1; i <= 9; i++) {
            soma += parseInt(cpf.substring(i-1, i)) * (11 - i);
        }
        
        resto = (soma * 10) % 11;
        if(resto === 10 || resto === 11) resto = 0;
        if(resto !== parseInt(cpf.substring(9, 10))) return false;
        
        soma = 0;
        for(let i = 1; i <= 10; i++) {
            soma += parseInt(cpf.substring(i-1, i)) * (12 - i);
        }
        
        resto = (soma * 10) % 11;
        if(resto === 10 || resto === 11) resto = 0;
        if(resto !== parseInt(cpf.substring(10, 11))) return false;
        
        return true;
    },
    
    validarCNPJ: function(cnpj) {
        cnpj = cnpj.replace(/\D/g, '');
        
        if(cnpj.length !== 14) return false;
        
        // Elimina CNPJs inválidos conhecidos
        if(/^(\d)\1+$/.test(cnpj)) return false;
        
        // Validação do dígito verificador
        let tamanho = cnpj.length - 2;
        let numeros = cnpj.substring(0, tamanho);
        let digitos = cnpj.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;
        
        for(let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if(pos < 2) pos = 9;
        }
        
        let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if(resultado !== parseInt(digitos.charAt(0))) return false;
        
        tamanho = tamanho + 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;
        
        for(let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if(pos < 2) pos = 9;
        }
        
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if(resultado !== parseInt(digitos.charAt(1))) return false;
        
        return true;
    },
    
    validarEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    deleteCliente: function(id) {
        if(confirm('Tem certeza que deseja excluir este cliente?')) {
            IzakGestao.data.clientes = IzakGestao.data.clientes.filter(c => c.id !== id);
            IzakGestao.saveData();
            this.renderClientesList();
            this.updateStats();
        }
    },
    
    filterClientes: function(searchTerm = null) {
        this.applyFilters(searchTerm);
    },

    applyFilters: function(searchTerm = null) {
        const clientes = document.querySelectorAll('.cliente-card');
        const searchInput = searchTerm !== null ? searchTerm : (document.getElementById('search-cliente')?.value || '');
        const term = this.normalizeText(searchInput);
        const tipoFiltro = (document.getElementById('filter-tipo')?.value || '').trim();
        const statusFiltro = (document.getElementById('filter-status-clientes')?.value || '').trim();

        const statusAtivoTerms = ['ativo', 'ativos', 'ativa', 'ativas'];
        const statusInativoTerms = ['inativo', 'inativos', 'inativa', 'inativas'];
        const tipoPfTerms = ['pf', 'pessoa fisica', 'pessoa física', 'fisica', 'física'];
        const tipoPjTerms = ['pj', 'pessoa juridica', 'pessoa jurídica', 'juridica', 'jurídica'];

        clientes.forEach(cliente => {
            const textoCompleto = this.normalizeText(cliente.textContent);
            const tipoCliente = this.normalizeText(cliente.dataset.tipo || '');
            const statusCliente = cliente.classList.contains('ativo') ? 'ativo' : 'inativo';

            const matchSearch = term === ''
                ? true
                : (
                    textoCompleto.includes(term) ||
                    (statusAtivoTerms.includes(term) && statusCliente === 'ativo') ||
                    (statusInativoTerms.includes(term) && statusCliente === 'inativo') ||
                    (tipoPfTerms.includes(term) && tipoCliente === 'pf') ||
                    (tipoPjTerms.includes(term) && tipoCliente === 'pj')
                  );

            const matchTipo = !tipoFiltro || tipoCliente === this.normalizeText(tipoFiltro);
            const matchStatus = !statusFiltro || statusCliente === this.normalizeText(statusFiltro);

            if(matchSearch && matchTipo && matchStatus) {
                cliente.style.display = '';
            } else {
                cliente.style.display = 'none';
            }
        });
    },

    normalizeText: function(text) {
        if(text === null || text === undefined) return '';
        let normalized = '';
        try {
            normalized = text.toString().normalize('NFD');
        } catch (e) {
            normalized = text.toString();
        }
        // Remove acentos via faixa Unicode (compatível com mais navegadores)
        normalized = normalized.replace(/[\u0300-\u036f]/g, '');
        return normalized.toLowerCase().trim();
    },
    
    filterByTipo: function() {
        this.applyFilters();
    },
    
    filterByStatus: function() {
        this.applyFilters();
    },
    
    clearFilters: function() {
        const search = document.getElementById('search-cliente');
        const tipo = document.getElementById('filter-tipo');
        const status = document.getElementById('filter-status-clientes');
        if(search) search.value = '';
        if(tipo) tipo.value = '';
        if(status) status.value = '';
        this.applyFilters('');
    },
    
    updateStats: function() {
        const total = IzakGestao.data.clientes.length;
        const ativos = IzakGestao.data.clientes.filter(c => c.status === 'ativo').length;
        const pj = IzakGestao.data.clientes.filter(c => c.tipo === 'pj').length;
        const pf = IzakGestao.data.clientes.filter(c => c.tipo === 'pf').length;
        
        const totalElem = this.getElement('total-clientes');
        const ativosElem = this.getElement('clientes-ativos');
        const pjElem = this.getElement('clientes-pj');
        const pfElem = this.getElement('clientes-pf');
        
        if(totalElem) totalElem.textContent = total;
        if(ativosElem) ativosElem.textContent = ativos;
        if(pjElem) pjElem.textContent = pj;
        if(pfElem) pfElem.textContent = pf;
    },
    
    renderClientesList: function() {
        const container = this.getElement('clientes-list');
        if(!container) return;
        container.innerHTML = '';
        
        // Ordena por nome
        const clientes = [...IzakGestao.data.clientes].sort((a, b) => 
            a.nome.localeCompare(b.nome)
        );
        
        if(clientes.length === 0) {
            container.innerHTML = '<p class="empty-clientes">Nenhum cliente cadastrado.</p>';
            return;
        }
        
        clientes.forEach(cliente => {
            const clienteElement = document.createElement('div');
            clienteElement.className = `cliente-card ${cliente.status}`;
            clienteElement.dataset.tipo = cliente.tipo;
            
            // Formata documento
            let documentoFormatado = '';
            if(cliente.tipo === 'pf') {
                documentoFormatado = cliente.documento.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            } else if(cliente.tipo === 'pj') {
                documentoFormatado = cliente.documento.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
            }
            
            // Formata telefone
            const telefoneFormatado = cliente.contato.telefone || 'Não informado';
            
            clienteElement.innerHTML = `
                <div class="cliente-header">
                    <div class="cliente-tipo">${cliente.tipo === 'pf' ? 'PF' : 'PJ'}</div>
                    <div class="cliente-nome">${cliente.nome}</div>
                    <div class="cliente-documento">${documentoFormatado}</div>
                </div>
                
                <div class="cliente-body">
                    <div class="cliente-info">
                        <div class="info-item">
                            <span class="info-label">Telefone:</span>
                            <span class="info-value">${telefoneFormatado}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">E-mail:</span>
                            <span class="info-value">${cliente.contato.email || 'Não informado'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Cidade:</span>
                            <span class="info-value">${cliente.endereco.cidade || 'Não informado'}</span>
                        </div>
                        <div class="cliente-quick-stats">
                            <div class="quick-stat">
                                <span>Orçamentos:</span>
                                <strong>${cliente.totalOrcamentos || 0}</strong>
                            </div>
                            <div class="quick-stat">
                                <span>Compras:</span>
                                <strong>${cliente.totalCompras || 0}</strong>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="cliente-footer">
                    <span class="cliente-status status-${cliente.status}">
                        ${cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                    <div class="cliente-actions">
                        <button class="btn-edit" data-id="${cliente.id}">Editar</button>
                        <button class="btn-delete" data-id="${cliente.id}">Excluir</button>
                        <button class="btn-accent" data-id="${cliente.id}" onclick="ClientesModule.verHistorico('${cliente.id}')">Histórico</button>
                    </div>
                </div>
            `;
            
            container.appendChild(clienteElement);
        });
        
        // Adiciona eventos aos botões
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const cliente = IzakGestao.data.clientes.find(c => c.id === id);
                this.showClienteForm(cliente);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                this.deleteCliente(id);
            });
        });

        // Reaplica filtros ativos após re-renderizar a lista
        this.applyFilters();
    },
    
    verHistorico: function(id) {
        const cliente = IzakGestao.data.clientes.find(c => c.id === id);
        if(!cliente) return;
        
        // Orçamentos deste cliente
        const orcamentosCliente = IzakGestao.data.orcamentos.filter(o => 
            o.cliente.nome.toLowerCase().includes(cliente.nome.toLowerCase())
        );
        
        let mensagem = `Histórico de ${cliente.nome}\n\n`;
        mensagem += `Total de Orçamentos: ${orcamentosCliente.length}\n\n`;
        
        if(orcamentosCliente.length > 0) {
            orcamentosCliente.slice(0, 5).forEach((orc, index) => {
                const data = new Date(orc.dataCriacao).toLocaleDateString('pt-BR');
                mensagem += `${index + 1}. ${orc.numero} - ${data}\n`;
                mensagem += `   Valor: R$ ${orc.total.toFixed(2)}\n`;
                mensagem += `   Status: ${orc.status}\n\n`;
            });
            
            if(orcamentosCliente.length > 5) {
                mensagem += `... e mais ${orcamentosCliente.length - 5} orçamentos.\n`;
            }
        } else {
            mensagem += 'Nenhum orçamento encontrado para este cliente.';
        }
        
        alert(mensagem);
    }
};