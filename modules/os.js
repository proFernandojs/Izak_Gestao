// Módulo de Ordens de Serviço
const OSModule = {
    init: function() {
        console.log('OSModule iniciando...');
        this.renderOSList();
        this.bindEvents();
        this.carregarEstatisticas();
        this.carregarOrcamentos();
        this.carregarClientes();
        
        // Define data atual como padrão
        const hoje = new Date().toISOString().split('T')[0];
        const dataEl = document.getElementById('os-data');
        const dataInicioEl = document.getElementById('os-data-inicio');
        if(dataEl) dataEl.value = hoje;
        if(dataInicioEl) dataInicioEl.value = hoje;
        
        // Gera número da OS
        this.gerarNumeroOS();
    },
    
    bindEvents: function() {
        console.log('Binding events do OSModule...');
        // Botão para adicionar nova OS
        const addOsBtn = document.getElementById('add-os-btn');
        console.log('Botão Nova OS encontrado:', addOsBtn);
        if(addOsBtn) {
            addOsBtn.addEventListener('click', (e) => {
                console.log('Clique no botão Nova OS');
                e.stopPropagation(); // Previne propagação
                this.showOSForm();
            });
        }
        
        // Formulário de salvamento
        const osForm = document.getElementById('os-form');
        if(osForm) {
            // Previne propagação de cliques no formulário
            osForm.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            osForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.saveOS();
            });
        }
        
        // Cancelar formulário
        const cancelBtn = document.getElementById('cancel-os-btn');
        if(cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Previne propagação
                this.hideOSForm();
            });
        }
        
        // Adicionar etapa
        const addEtapaBtn = document.getElementById('add-etapa-btn');
        if(addEtapaBtn) {
            addEtapaBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Previne propagação
                this.addEtapa();
            });
        }
        
        // Filtros
        const searchOs = document.getElementById('search-os');
        if(searchOs) {
            searchOs.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            searchOs.addEventListener('input', (e) => {
                e.stopPropagation();
                this.filterOS(e.target.value);
            });
        }
        
        const filterStatus = document.getElementById('filter-os-status');
        if(filterStatus) {
            filterStatus.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            filterStatus.addEventListener('change', (e) => {
                e.stopPropagation();
                this.filterByStatus(e.target.value);
            });
        }
        
        const filterPrioridade = document.getElementById('filter-os-prioridade');
        if(filterPrioridade) {
            filterPrioridade.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            filterPrioridade.addEventListener('change', (e) => {
                e.stopPropagation();
                this.filterByPrioridade(e.target.value);
            });
        }
        
        const filterDate = document.getElementById('filter-os-date');
        if(filterDate) {
            filterDate.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            filterDate.addEventListener('change', (e) => {
                e.stopPropagation();
                this.filterByDate(e.target.value);
            });
        }
        
        const clearFilters = document.getElementById('clear-os-filters');
        if(clearFilters) {
            clearFilters.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearFilters();
            });
        }
        
        // Relatório
        const relatorioBtn = document.getElementById('relatorio-os-btn');
        if(relatorioBtn) {
            relatorioBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.gerarRelatorio();
            });
        }
        
        // Vincular orçamento
        const osOrcamento = document.getElementById('os-orcamento');
        if(osOrcamento) {
            osOrcamento.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            osOrcamento.addEventListener('change', (e) => {
                e.stopPropagation();
                this.vincularOrcamento(e.target.value);
            });
        }
        
        // Calcular data de conclusão baseada no prazo
        const osDataInicio = document.getElementById('os-data-inicio');
        if(osDataInicio) {
            osDataInicio.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            osDataInicio.addEventListener('change', (e) => {
                e.stopPropagation();
                this.calcularDataConclusao();
            });
        }
        
        const osPrazo = document.getElementById('os-prazo');
        if(osPrazo) {
            osPrazo.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            osPrazo.addEventListener('input', (e) => {
                e.stopPropagation();
                this.calcularDataConclusao();
            });
        }
        
        // Previne propagação na container de filtros
        const osFilters = document.querySelector('.os-filters');
        if(osFilters) {
            osFilters.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    },
    
    showOSForm: function(os = null) {
        this.currentOS = os;
        
        const form = document.getElementById('os-form');
        form.reset();
        
        // Define data atual como padrão
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('os-data').value = hoje;
        document.getElementById('os-data-inicio').value = hoje;
        
        if(os) {
            // Modo edição
            form.dataset.id = os.id;
            document.getElementById('os-numero').value = os.numero;
            document.getElementById('os-data').value = os.dataAbertura.split('T')[0];
            document.getElementById('os-cliente').value = os.cliente;
            document.getElementById('os-contato').value = os.contato || '';
            document.getElementById('os-descricao').value = os.descricao;
            document.getElementById('os-responsavel').value = os.responsavel;
            document.getElementById('os-prioridade').value = os.prioridade;
            document.getElementById('os-status').value = os.status;
            
            if(os.dataInicio) {
                document.getElementById('os-data-inicio').value = os.dataInicio.split('T')[0];
            }
            
            document.getElementById('os-prazo').value = os.prazo;
            
            if(os.dataConclusao) {
                document.getElementById('os-data-conclusao').value = os.dataConclusao.split('T')[0];
            }
            
            document.getElementById('os-valor').value = os.valor || '';
            document.getElementById('os-materiais').value = os.materiais || '';
            document.getElementById('os-observacoes').value = os.observacoes || '';
            
            // Carrega etapas
            this.carregarEtapas(os.etapas || []);
            
            // Carrega orçamento vinculado
            if(os.orcamentoId) {
                document.getElementById('os-orcamento').value = os.orcamentoId;
            }
            
            document.getElementById('os-form-title').textContent = 'Editar Ordem de Serviço';
        } else {
            // Modo criação
            form.removeAttribute('data-id');
            this.gerarNumeroOS();
            this.addEtapa(); // Adiciona uma etapa padrão
            document.getElementById('os-form-title').textContent = 'Nova Ordem de Serviço';
        }
        
        document.getElementById('os-form-container').classList.remove('hidden');
        document.getElementById('os-list-container').classList.add('hidden');
        
        // Calcula data de conclusão
        this.calcularDataConclusao();
    },
    
    hideOSForm: function() {
        document.getElementById('os-form-container').classList.add('hidden');
        document.getElementById('os-list-container').classList.remove('hidden');
        this.carregarEstatisticas();
    },
    
    gerarNumeroOS: function() {
        const year = new Date().getFullYear();
        const count = (IzakGestao.data.ordensServico.length + 1).toString().padStart(4, '0');
        document.getElementById('os-numero').value = `OS${year}${count}`;
    },
    
    addEtapa: function(etapa = null) {
        const container = document.getElementById('os-etapas');
        if(!container) {
            console.error('Container os-etapas não encontrado');
            return;
        }
        const etapaId = Date.now() + Math.random().toString(36).substr(2, 9);
        
        const etapaElement = document.createElement('div');
        etapaElement.className = 'etapa-item';
        etapaElement.innerHTML = `
            <input type="text" class="etapa-descricao" placeholder="Descrição da etapa" 
                   value="${etapa ? etapa.descricao : ''}">
            <select class="etapa-status">
                <option value="pendente" ${etapa && etapa.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                <option value="andamento" ${etapa && etapa.status === 'andamento' ? 'selected' : ''}>Em Andamento</option>
                <option value="concluida" ${etapa && etapa.status === 'concluida' ? 'selected' : ''}>Concluída</option>
            </select>
            <button type="button" class="remove-etapa">Remover</button>
        `;
        
        container.appendChild(etapaElement);
        
        // Adiciona evento ao botão remover
        etapaElement.querySelector('.remove-etapa').addEventListener('click', () => {
            etapaElement.remove();
        });
    },
    
    carregarEtapas: function(etapas) {
        const container = document.getElementById('os-etapas');
        if(!container) {
            console.error('Container os-etapas não encontrado');
            return;
        }
        container.innerHTML = '';
        
        if(etapas && etapas.length > 0) {
            etapas.forEach(etapa => {
                this.addEtapa(etapa);
            });
        } else {
            this.addEtapa();
        }
    },
    
    calcularDataConclusao: function() {
        const dataInicio = document.getElementById('os-data-inicio').value;
        const prazo = parseInt(document.getElementById('os-prazo').value) || 0;
        
        if(dataInicio && prazo > 0) {
            const data = new Date(dataInicio);
            data.setDate(data.getDate() + prazo);
            const dataConclusao = data.toISOString().split('T')[0];
            document.getElementById('os-data-conclusao').value = dataConclusao;
        }
    },
    
    carregarOrcamentos: function() {
        const select = document.getElementById('os-orcamento');
        const datalist = document.getElementById('os-clientes-list');
        
        if(!select || !datalist) {
            console.warn('Elementos os-orcamento ou os-clientes-list não encontrados');
            return;
        }
        
        // Limpa opções existentes (exceto a primeira)
        while(select.options.length > 1) {
            select.remove(1);
        }
        
        datalist.innerHTML = '';
        
        // Adiciona orçamentos aprovados
        IzakGestao.data.orcamentos
            .filter(o => o.status === 'aprovado')
            .forEach(orcamento => {
                const option = document.createElement('option');
                option.value = orcamento.id;
                option.textContent = `${orcamento.numero} - ${orcamento.cliente.nome} - R$ ${orcamento.total.toFixed(2)}`;
                select.appendChild(option);
            });
        
        // Adiciona clientes únicos
        const clientes = [...new Set(IzakGestao.data.orcamentos.map(o => o.cliente.nome))];
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente;
            datalist.appendChild(option);
        });
    },
    
    carregarClientes: function() {
        // Também carrega clientes do módulo de clientes se existir
        if(IzakGestao.data.clientes && IzakGestao.data.clientes.length > 0) {
            const datalist = document.getElementById('os-clientes-list');
            if(!datalist) {
                console.warn('Elemento os-clientes-list não encontrado');
                return;
            }
            IzakGestao.data.clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.nome;
                datalist.appendChild(option);
            });
        }
    },
    
    vincularOrcamento: function(orcamentoId) {
        if(!orcamentoId) return;
        
        const orcamento = IzakGestao.data.orcamentos.find(o => o.id === orcamentoId);
        if(orcamento) {
            document.getElementById('os-cliente').value = orcamento.cliente.nome;
            document.getElementById('os-contato').value = orcamento.cliente.telefone || '';
            document.getElementById('os-descricao').value = orcamento.descricao;
            document.getElementById('os-valor').value = orcamento.total;
        }
    },
    
    saveOS: function() {
        console.log('saveOS chamado');
        const form = document.getElementById('os-form');
        
        // Coleta as etapas
        const etapas = [];
        document.querySelectorAll('.etapa-item').forEach(item => {
            const descricao = item.querySelector('.etapa-descricao').value;
            const status = item.querySelector('.etapa-status').value;
            
            if(descricao) {
                etapas.push({
                    descricao,
                    status,
                    dataCriacao: new Date().toISOString()
                });
            }
        });
        
        // Calcula progresso baseado nas etapas
        const totalEtapas = etapas.length;
        const etapasConcluidas = etapas.filter(e => e.status === 'concluida').length;
        const progresso = totalEtapas > 0 ? Math.round((etapasConcluidas / totalEtapas) * 100) : 0;
        
        const os = {
            id: form.dataset.id || Date.now().toString(),
            numero: document.getElementById('os-numero').value,
            dataAbertura: document.getElementById('os-data').value + 'T00:00:00Z',
            cliente: document.getElementById('os-cliente').value,
            contato: document.getElementById('os-contato').value,
            descricao: document.getElementById('os-descricao').value,
            responsavel: document.getElementById('os-responsavel').value,
            prioridade: document.getElementById('os-prioridade').value,
            status: document.getElementById('os-status').value,
            dataInicio: document.getElementById('os-data-inicio').value ? 
                       document.getElementById('os-data-inicio').value + 'T00:00:00Z' : null,
            prazo: parseInt(document.getElementById('os-prazo').value) || 7,
            dataConclusao: document.getElementById('os-data-conclusao').value ? 
                          document.getElementById('os-data-conclusao').value + 'T00:00:00Z' : null,
            valor: parseFloat(document.getElementById('os-valor').value) || 0,
            materiais: document.getElementById('os-materiais').value,
            etapas: etapas,
            progresso: progresso,
            orcamentoId: document.getElementById('os-orcamento').value || null,
            observacoes: document.getElementById('os-observacoes').value,
            dataAtualizacao: new Date().toISOString()
        };
        
        console.log('OS a salvar:', os);
        
        // Verifica se está atrasada
        const hoje = new Date();
        const dataPrevista = os.dataConclusao ? new Date(os.dataConclusao) : null;
        os.atrasada = dataPrevista && hoje > dataPrevista && os.status !== 'finalizada' && os.status !== 'cancelada';
        
        // Atualiza ou adiciona a OS
        const index = IzakGestao.data.ordensServico.findIndex(o => o.id === os.id);
        console.log('Index da OS encontrada:', index);
        if(index >= 0) {
            console.log('Atualizando OS existente no índice:', index);
            IzakGestao.data.ordensServico[index] = os;
        } else {
            console.log('Adicionando nova OS');
            IzakGestao.data.ordensServico.push(os);
        }
        
        IzakGestao.saveData();
        this.renderOSList();
        this.hideOSForm();
        
        // Atualiza dashboard
        IzakGestao.updateDashboard();
    },
    
    deleteOS: function(id) {
        if(confirm('Tem certeza que deseja excluir esta Ordem de Serviço?')) {
            IzakGestao.data.ordensServico = IzakGestao.data.ordensServico.filter(o => o.id !== id);
            IzakGestao.saveData();
            this.renderOSList();
            this.carregarEstatisticas();
        }
    },
    
    carregarEstatisticas: function() {
        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();
        
        // Calcula estatísticas
        const abertas = IzakGestao.data.ordensServico.filter(os => 
            os.status === 'aberta' || os.status === 'andamento' || os.status === 'aguardando'
        ).length;
        
        const emAndamento = IzakGestao.data.ordensServico.filter(os => 
            os.status === 'andamento'
        ).length;
        
        const atrasadas = IzakGestao.data.ordensServico.filter(os => {
            if(os.status === 'finalizada' || os.status === 'cancelada') return false;
            if(!os.dataConclusao) return false;
            
            const dataConclusao = new Date(os.dataConclusao);
            return hoje > dataConclusao;
        }).length;
        
        const finalizadasMes = IzakGestao.data.ordensServico.filter(os => {
            if(os.status !== 'finalizada') return false;
            
            const dataFinalizacao = new Date(os.dataAtualizacao);
            return dataFinalizacao.getMonth() === mesAtual && 
                   dataFinalizacao.getFullYear() === anoAtual;
        }).length;
        
        // Atualiza os elementos
        const osAbertasEl = document.getElementById('os-abertas');
        const osAndamentoEl = document.getElementById('os-andamento-stats');
        const osAtrasadasEl = document.getElementById('os-atrasadas');
        const osFinalizadasEl = document.getElementById('os-finalizadas-mes');
        
        if(osAbertasEl) osAbertasEl.textContent = abertas;
        if(osAndamentoEl) osAndamentoEl.textContent = emAndamento;
        if(osAtrasadasEl) osAtrasadasEl.textContent = atrasadas;
        if(osFinalizadasEl) osFinalizadasEl.textContent = finalizadasMes;
    },
    
    filterOS: function(searchTerm) {
        const osList = document.querySelectorAll('.os-item');
        const term = searchTerm.toLowerCase();
        
        osList.forEach(item => {
            const numero = item.querySelector('.os-number').textContent.toLowerCase();
            const cliente = item.querySelector('.os-cliente').textContent.toLowerCase();
            const descricao = item.querySelector('.os-descricao').textContent.toLowerCase();
            
            if(numero.includes(term) || cliente.includes(term) || descricao.includes(term)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    filterByStatus: function(status) {
        if(!status) {
            document.querySelectorAll('.os-item').forEach(item => {
                item.style.display = '';
            });
            return;
        }
        
        document.querySelectorAll('.os-item').forEach(item => {
            const itemStatus = item.dataset.status;
            if(itemStatus === status) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    filterByPrioridade: function(prioridade) {
        if(!prioridade) {
            document.querySelectorAll('.os-item').forEach(item => {
                item.style.display = '';
            });
            return;
        }
        
        document.querySelectorAll('.os-item').forEach(item => {
            const itemPrioridade = item.dataset.prioridade;
            if(itemPrioridade === prioridade) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    filterByDate: function(date) {
        if(!date) {
            document.querySelectorAll('.os-item').forEach(item => {
                item.style.display = '';
            });
            return;
        }
        
        const filterDate = new Date(date);
        
        document.querySelectorAll('.os-item').forEach(item => {
            const itemDate = new Date(item.dataset.data);
            if(itemDate.toDateString() === filterDate.toDateString()) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    clearFilters: function() {
        document.getElementById('search-os').value = '';
        document.getElementById('filter-os-status').value = '';
        document.getElementById('filter-os-prioridade').value = '';
        document.getElementById('filter-os-date').value = '';
        
        document.querySelectorAll('.os-item').forEach(item => {
            item.style.display = '';
        });
    },
    
    renderOSList: function() {
        const container = document.getElementById('os-list');
        if(!container) {
            console.error('Container os-list não encontrado');
            return;
        }
        container.innerHTML = '';
        
        // Ordena por prioridade e data (urgentes primeiro, depois mais recentes)
        const osList = [...IzakGestao.data.ordensServico].sort((a, b) => {
            // Define pesos para prioridades
            const pesoPrioridade = {
                'urgente': 4,
                'alta': 3,
                'media': 2,
                'baixa': 1
            };
            
            const pesoA = pesoPrioridade[a.prioridade] || 0;
            const pesoB = pesoPrioridade[b.prioridade] || 0;
            
            if(pesoA !== pesoB) {
                return pesoB - pesoA; // Maior prioridade primeiro
            }
            
            // Se mesma prioridade, ordena por data (mais recente primeiro)
            return new Date(b.dataAbertura) - new Date(a.dataAbertura);
        });
        
        if(osList.length === 0) {
            container.innerHTML = '<p class="empty-os">Nenhuma Ordem de Serviço cadastrada.</p>';
            return;
        }
        
        osList.forEach(os => {
            const osElement = document.createElement('div');
            osElement.className = `os-item ${os.atrasada ? 'atrasada' : ''} ${os.prioridade === 'urgente' ? 'urgente' : ''}`;
            osElement.dataset.status = os.status;
            osElement.dataset.prioridade = os.prioridade;
            osElement.dataset.data = os.dataAbertura;
            
            // Formata as datas
            const dataAbertura = new Date(os.dataAbertura);
            const dataAberturaFormatada = dataAbertura.toLocaleDateString('pt-BR');
            
            const dataConclusao = os.dataConclusao ? new Date(os.dataConclusao) : null;
            const dataConclusaoFormatada = dataConclusao ? dataConclusao.toLocaleDateString('pt-BR') : 'Não definida';
            
            // Status badge
            const statusText = {
                'aberta': 'Aberta',
                'andamento': 'Em Andamento',
                'aguardando': 'Aguardando Aprovação',
                'finalizada': 'Finalizada',
                'cancelada': 'Cancelada'
            }[os.status] || 'Aberta';
            
            // Prioridade badge
            const prioridadeText = {
                'baixa': 'Baixa',
                'media': 'Média',
                'alta': 'Alta',
                'urgente': 'Urgente'
            }[os.prioridade] || 'Média';
            
            osElement.innerHTML = `
                <div class="os-header">
                    <div class="os-info">
                        <h3>
                            <span class="os-number">${os.numero}</span>
                            <span class="os-status-badge status-${os.status}">${statusText}</span>
                            <span class="prioridade-badge prioridade-${os.prioridade}">${prioridadeText}</span>
                            ${os.atrasada ? '<span class="status-badge status-cancelada">ATRASADA</span>' : ''}
                        </h3>
                        <p class="os-cliente">Cliente: ${os.cliente}</p>
                        <p class="os-descricao">${os.descricao}</p>
                        <div class="os-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${os.progresso}%"></div>
                            </div>
                            <div class="progress-text">
                                <span>Progresso</span>
                                <span>${os.progresso}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="os-valor">
                        <span class="valor-total">R$ ${os.valor.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="os-details">
                    <div class="os-detail-item">
                        <span class="os-detail-label">Responsável</span>
                        <span class="os-detail-value">${os.responsavel}</span>
                    </div>
                    <div class="os-detail-item">
                        <span class="os-detail-label">Data Abertura</span>
                        <span class="os-detail-value">${dataAberturaFormatada}</span>
                    </div>
                    <div class="os-detail-item">
                        <span class="os-detail-label">Prazo</span>
                        <span class="os-detail-value">${os.prazo} dias</span>
                    </div>
                    <div class="os-detail-item">
                        <span class="os-detail-label">Previsão Entrega</span>
                        <span class="os-detail-value">${dataConclusaoFormatada}</span>
                    </div>
                    <div class="os-detail-item">
                        <span class="os-detail-label">Etapas</span>
                        <span class="os-detail-value">${os.etapas ? os.etapas.length : 0}</span>
                    </div>
                </div>
                
                <div class="os-actions">
                    <button class="btn-edit" data-id="${os.id}">Editar</button>
                    <button class="btn-delete" data-id="${os.id}">Excluir</button>
                    <button class="btn-accent" onclick="OSModule.marcarComoConcluida('${os.id}')">Concluir</button>
                    <button class="btn-primary" onclick="OSModule.verDetalhes('${os.id}')">Detalhes</button>
                </div>
            `;
            
            // Previne propagação de cliques no item
            osElement.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            container.appendChild(osElement);
        });
        
        // Adiciona eventos aos botões
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Previne propagação
                const id = e.target.getAttribute('data-id');
                const osItem = IzakGestao.data.ordensServico.find(o => o.id === id);
                this.showOSForm(osItem);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Previne propagação
                const id = e.target.getAttribute('data-id');
                this.deleteOS(id);
            });
        });
    },
    
    marcarComoConcluida: function(id) {
        const osIndex = IzakGestao.data.ordensServico.findIndex(o => o.id === id);
        if(osIndex >= 0) {
            if(confirm('Deseja marcar esta OS como concluída?')) {
                IzakGestao.data.ordensServico[osIndex].status = 'finalizada';
                IzakGestao.data.ordensServico[osIndex].dataAtualizacao = new Date().toISOString();
                
                // Marca todas as etapas como concluídas
                if(IzakGestao.data.ordensServico[osIndex].etapas) {
                    IzakGestao.data.ordensServico[osIndex].etapas.forEach(etapa => {
                        etapa.status = 'concluida';
                    });
                    IzakGestao.data.ordensServico[osIndex].progresso = 100;
                }
                
                IzakGestao.saveData();
                this.renderOSList();
                this.carregarEstatisticas();
                IzakGestao.updateDashboard();
            }
        }
    },
    
    verDetalhes: function(id) {
        const os = IzakGestao.data.ordensServico.find(o => o.id === id);
        if(!os) return;
        
        // Cria um modal com os detalhes
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Detalhes da OS: ${os.numero}</h2>
                
                <div class="detalhes-grid">
                    <div class="detalhes-item">
                        <strong>Cliente:</strong> ${os.cliente}
                    </div>
                    <div class="detalhes-item">
                        <strong>Contato:</strong> ${os.contato || 'Não informado'}
                    </div>
                    <div class="detalhes-item">
                        <strong>Responsável:</strong> ${os.responsavel}
                    </div>
                    <div class="detalhes-item">
                        <strong>Status:</strong> <span class="status-badge status-${os.status}">
                            ${this.getStatusText(os.status)}
                        </span>
                    </div>
                    <div class="detalhes-item">
                        <strong>Prioridade:</strong> <span class="prioridade-badge prioridade-${os.prioridade}">
                            ${this.getPrioridadeText(os.prioridade)}
                        </span>
                    </div>
                    <div class="detalhes-item">
                        <strong>Data Abertura:</strong> ${new Date(os.dataAbertura).toLocaleDateString('pt-BR')}
                    </div>
                    <div class="detalhes-item">
                        <strong>Previsão Entrega:</strong> ${os.dataConclusao ? new Date(os.dataConclusao).toLocaleDateString('pt-BR') : 'Não definida'}
                    </div>
                    <div class="detalhes-item">
                        <strong>Valor:</strong> R$ ${os.valor.toFixed(2)}
                    </div>
                </div>
                
                <h3>Descrição do Serviço</h3>
                <p>${os.descricao}</p>
                
                <h3>Materiais Necessários</h3>
                <p>${os.materiais || 'Não especificado'}</p>
                
                <h3>Etapas do Serviço</h3>
                <div class="timeline">
                    ${os.etapas && os.etapas.length > 0 ? 
                        os.etapas.map(etapa => `
                            <div class="timeline-item ${etapa.status}">
                                <div class="timeline-content">
                                    <strong>${etapa.descricao}</strong>
                                    <div class="timeline-date">
                                        Status: ${this.getStatusEtapaText(etapa.status)}
                                    </div>
                                </div>
                            </div>
                        `).join('') : 
                        '<p>Nenhuma etapa definida.</p>'
                    }
                </div>
                
                <h3>Observações</h3>
                <p>${os.observacoes || 'Nenhuma observação.'}</p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Estilos do modal
        const style = document.createElement('style');
        style.textContent = `
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .modal-content {
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                max-width: 800px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
            }
            
            .close-modal {
                position: absolute;
                top: 15px;
                right: 15px;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }
            
            .detalhes-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin: 20px 0;
            }
            
            .detalhes-item {
                padding: 10px;
                background-color: #f9f9f9;
                border-radius: 4px;
            }
        `;
        document.head.appendChild(style);
        
        // Fecha o modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        });
        
        // Fecha ao clicar fora
        modal.addEventListener('click', (e) => {
            if(e.target === modal) {
                document.body.removeChild(modal);
                document.head.removeChild(style);
            }
        });
    },
    
    getStatusText: function(status) {
        const statusMap = {
            'aberta': 'Aberta',
            'andamento': 'Em Andamento',
            'aguardando': 'Aguardando Aprovação',
            'finalizada': 'Finalizada',
            'cancelada': 'Cancelada'
        };
        return statusMap[status] || status;
    },
    
    getPrioridadeText: function(prioridade) {
        const prioridadeMap = {
            'baixa': 'Baixa',
            'media': 'Média',
            'alta': 'Alta',
            'urgente': 'Urgente'
        };
        return prioridadeMap[prioridade] || prioridade;
    },
    
    getStatusEtapaText: function(status) {
        const statusMap = {
            'pendente': 'Pendente',
            'andamento': 'Em Andamento',
            'concluida': 'Concluída'
        };
        return statusMap[status] || status;
    },
    
    gerarRelatorio: function() {
        // Cria uma nova janela para o relatório
        const printWindow = window.open('', '_blank');
        
        const hoje = new Date();
        const dataFormatada = hoje.toLocaleDateString('pt-BR');
        
        // Dados para o relatório
        const totalOS = IzakGestao.data.ordensServico.length;
        const finalizadas = IzakGestao.data.ordensServico.filter(os => os.status === 'finalizada').length;
        const emAndamento = IzakGestao.data.ordensServico.filter(os => os.status === 'andamento').length;
        const atrasadas = IzakGestao.data.ordensServico.filter(os => os.atrasada).length;
        
        const valorTotal = IzakGestao.data.ordensServico.reduce((sum, os) => sum + os.valor, 0);
        
        // Conteúdo HTML para o relatório
        const relatorioContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Relatório de OS - ${dataFormatada}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #0055A4; }
                    .resumo { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
                    .resumo-item { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                    .resumo-valor { font-size: 18px; font-weight: bold; color: #0055A4; }
                    .tabela { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .tabela th, .tabela td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .tabela th { background-color: #f2f2f2; }
                    .status-badge { padding: 2px 6px; border-radius: 4px; font-size: 12px; color: white; }
                    .status-aberta { background-color: #f39c12; }
                    .status-andamento { background-color: #FFD700; color: #333; }
                    .status-finalizada { background-color: #27ae60; }
                    .status-cancelada { background-color: #e74c3c; }
                    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Izak Comunicação Visual</h1>
                    <h2>Relatório de Ordens de Serviço</h2>
                    <p>Data do relatório: ${dataFormatada}</p>
                </div>
                
                <div class="resumo">
                    <div class="resumo-item">
                        <div>Total de OS</div>
                        <div class="resumo-valor">${totalOS}</div>
                    </div>
                    <div class="resumo-item">
                        <div>Finalizadas</div>
                        <div class="resumo-valor">${finalizadas}</div>
                    </div>
                    <div class="resumo-item">
                        <div>Em Andamento</div>
                        <div class="resumo-valor">${emAndamento}</div>
                    </div>
                    <div class="resumo-item">
                        <div>Atrasadas</div>
                        <div class="resumo-valor">${atrasadas}</div>
                    </div>
                </div>
                
                <h3>Valor Total em OS: R$ ${valorTotal.toFixed(2)}</h3>
                
                <table class="tabela">
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Cliente</th>
                            <th>Responsável</th>
                            <th>Status</th>
                            <th>Data Abertura</th>
                            <th>Previsão Entrega</th>
                            <th>Valor (R$)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${IzakGestao.data.ordensServico.map(os => `
                            <tr>
                                <td>${os.numero}</td>
                                <td>${os.cliente}</td>
                                <td>${os.responsavel}</td>
                                <td>
                                    <span class="status-badge status-${os.status}">
                                        ${this.getStatusText(os.status)}
                                    </span>
                                </td>
                                <td>${new Date(os.dataAbertura).toLocaleDateString('pt-BR')}</td>
                                <td>${os.dataConclusao ? new Date(os.dataConclusao).toLocaleDateString('pt-BR') : 'Não definida'}</td>
                                <td>${os.valor.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>Izak Comunicação Visual - Sistema de Gestão</p>
                    <p>Relatório gerado automaticamente pelo sistema</p>
                </div>
                
                <div class="no-print" style="margin-top: 20px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; background-color: #0055A4; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Imprimir Relatório
                    </button>
                </div>
            </body>
            </html>
        `;
        
        printWindow.document.write(relatorioContent);
        printWindow.document.close();
    }
};