// Módulo de Relatórios
const RelatoriosModule = {
    filtrosAtuais: {},
    dadosRelatorio: {},
    
    init: function() {
        this.carregarEstatisticas();
        this.bindEvents();
        this.configurarDatas();
    },
    
    bindEvents: function() {
        // Gerar relatório
        document.getElementById('gerar-relatorio-btn').addEventListener('click', () => {
            this.gerarRelatorio();
        });
        
        // Aplicar filtros
        document.getElementById('aplicar-filtros-btn').addEventListener('click', () => {
            this.gerarRelatorio();
        });
        
        // Limpar filtros
        document.getElementById('limpar-filtros-btn').addEventListener('click', () => {
            this.limparFiltros();
        });
        
        // Mudança de período
        document.getElementById('periodo').addEventListener('change', (e) => {
            this.togglePeriodoPersonalizado(e.target.value);
        });
        
        // Relatórios rápidos
        document.querySelectorAll('.relatorio-rapido').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tipo = e.target.getAttribute('data-tipo');
                this.gerarRelatorioRapido(tipo);
            });
        });
        
        // Ações do relatório
        document.getElementById('imprimir-relatorio').addEventListener('click', () => {
            this.imprimirRelatorio();
        });
        
        document.getElementById('exportar-relatorio').addEventListener('click', () => {
            this.exportarRelatorio();
        });
    },
    
    configurarDatas: function() {
        const hoje = new Date();
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        
        document.getElementById('data-inicio').value = primeiroDiaMes.toISOString().split('T')[0];
        document.getElementById('data-fim').value = ultimoDiaMes.toISOString().split('T')[0];
    },
    
    togglePeriodoPersonalizado: function(periodo) {
        const container = document.getElementById('periodo-personalizado');
        if(periodo === 'personalizado') {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    },
    
    limparFiltros: function() {
        document.getElementById('tipo-relatorio').value = '';
        document.getElementById('periodo').value = '';
        document.getElementById('formato-relatorio').value = 'tela';
        document.getElementById('periodo-personalizado').classList.add('hidden');
        
        this.filtrosAtuais = {};
        this.limparRelatorio();
    },
    
    limparRelatorio: function() {
        document.getElementById('relatorio-conteudo').classList.add('hidden');
        document.getElementById('relatorio-resultado').querySelector('.relatorio-vazio').classList.remove('hidden');
    },
    
    carregarEstatisticas: function() {
        // Receita mensal
        const orcamentosMes = this.filtrarPorPeriodo(IzakGestao.data.orcamentos, 'mes');
        const receitaMes = orcamentosMes.reduce((total, orc) => {
            if(orc.status === 'aprovado' || orc.status === 'concluido') {
                return total + orc.total;
            }
            return total;
        }, 0);
        
        document.getElementById('receita-mensal').textContent = `R$ ${receitaMes.toFixed(2)}`;
        
        // Total de orçamentos
        document.getElementById('total-orcamentos').textContent = IzakGestao.data.orcamentos.length;
        
        // OS em andamento
        const osAndamento = IzakGestao.data.ordensServico.filter(os => os.status === 'andamento').length;
        document.getElementById('os-andamento-rel').textContent = osAndamento;
        
        // Itens em estoque
        const itensEstoque = IzakGestao.data.estoque.reduce((total, item) => total + item.quantidade, 0);
        document.getElementById('itens-estoque').textContent = itensEstoque;
    },
    
    obterFiltros: function() {
        const tipo = document.getElementById('tipo-relatorio').value;
        const periodo = document.getElementById('periodo').value;
        const formato = document.getElementById('formato-relatorio').value;
        
        if(!tipo || !periodo) {
            alert('Por favor, selecione o tipo de relatório e o período.');
            return null;
        }
        
        let dataInicio, dataFim;
        
        if(periodo === 'personalizado') {
            dataInicio = new Date(document.getElementById('data-inicio').value);
            dataFim = new Date(document.getElementById('data-fim').value);
            
            if(isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
                alert('Por favor, selecione datas válidas para o período personalizado.');
                return null;
            }
        } else {
            const datas = this.obterDatasPorPeriodo(periodo);
            dataInicio = datas.inicio;
            dataFim = datas.fim;
        }
        
        return {
            tipo,
            periodo,
            formato,
            dataInicio,
            dataFim
        };
    },
    
    obterDatasPorPeriodo: function(periodo) {
        const hoje = new Date();
        let inicio, fim;
        
        switch(periodo) {
            case 'hoje':
                inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
                fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
                break;
                
            case 'semana':
                const diaSemana = hoje.getDay();
                const diferenca = diaSemana === 0 ? 6 : diaSemana - 1; // Segunda-feira como primeiro dia
                inicio = new Date(hoje);
                inicio.setDate(hoje.getDate() - diferenca);
                inicio.setHours(0, 0, 0, 0);
                
                fim = new Date(inicio);
                fim.setDate(inicio.getDate() + 6);
                fim.setHours(23, 59, 59, 999);
                break;
                
            case 'mes':
                inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
                break;
                
            case 'trimestre':
                const trimestre = Math.floor(hoje.getMonth() / 3);
                inicio = new Date(hoje.getFullYear(), trimestre * 3, 1);
                fim = new Date(hoje.getFullYear(), (trimestre + 1) * 3, 0, 23, 59, 59);
                break;
                
            case 'semestre':
                const semestre = Math.floor(hoje.getMonth() / 6);
                inicio = new Date(hoje.getFullYear(), semestre * 6, 1);
                fim = new Date(hoje.getFullYear(), (semestre + 1) * 6, 0, 23, 59, 59);
                break;
                
            case 'ano':
                inicio = new Date(hoje.getFullYear(), 0, 1);
                fim = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59);
                break;
                
            default:
                inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
        }
        
        return { inicio, fim };
    },
    
    gerarRelatorio: function() {
        const filtros = this.obterFiltros();
        if(!filtros) return;
        
        this.filtrosAtuais = filtros;
        
        // Processa dados de acordo com o tipo de relatório
        switch(filtros.tipo) {
            case 'financeiro':
                this.gerarRelatorioFinanceiro(filtros);
                break;
            case 'vendas':
                this.gerarRelatorioVendas(filtros);
                break;
            case 'estoque':
                this.gerarRelatorioEstoque(filtros);
                break;
            case 'producao':
                this.gerarRelatorioProducao(filtros);
                break;
            case 'clientes':
                this.gerarRelatorioClientes(filtros);
                break;
            case 'lucro-prejuizo':
                this.gerarRelatorioLucroPrejuizo(filtros);
                break;
        }
        
        // Mostra o relatório na tela
        document.querySelector('.relatorio-vazio').classList.add('hidden');
        document.getElementById('relatorio-conteudo').classList.remove('hidden');
        
        // Atualiza estatísticas
        this.carregarEstatisticas();
    },
    
    gerarRelatorioRapido: function(tipo) {
        let filtros;
        
        switch(tipo) {
            case 'orcamentos-hoje':
                document.getElementById('tipo-relatorio').value = 'vendas';
                document.getElementById('periodo').value = 'hoje';
                break;
            case 'os-pendentes':
                document.getElementById('tipo-relatorio').value = 'producao';
                document.getElementById('periodo').value = 'mes';
                break;
            case 'estoque-minimo':
                document.getElementById('tipo-relatorio').value = 'estoque';
                document.getElementById('periodo').value = '';
                break;
            case 'receber-mes':
                document.getElementById('tipo-relatorio').value = 'financeiro';
                document.getElementById('periodo').value = 'mes';
                break;
            case 'pagar-mes':
                document.getElementById('tipo-relatorio').value = 'financeiro';
                document.getElementById('periodo').value = 'mes';
                break;
        }
        
        this.gerarRelatorio();
    },
    
    gerarRelatorioFinanceiro: function(filtros) {
        const dados = {
            receitas: [],
            despesas: [],
            saldo: 0
        };
        
        // Filtra orçamentos aprovados/concluídos no período
        const orcamentosFiltrados = this.filtrarPorPeriodo(IzakGestao.data.orcamentos, filtros.dataInicio, filtros.dataFim)
            .filter(o => o.status === 'aprovado' || o.status === 'concluido');
        
        // Receitas
        orcamentosFiltrados.forEach(orc => {
            dados.receitas.push({
                data: new Date(orc.dataCriacao),
                descricao: orc.descricao,
                cliente: orc.cliente.nome,
                valor: orc.total,
                formaPagamento: orc.pagamento.forma
            });
            dados.saldo += orc.total;
        });
        
        // Despesas (usando contas a pagar, se existir)
        if(IzakGestao.data.financeiro && IzakGestao.data.financeiro.contasPagar) {
            const contasFiltradas = this.filtrarPorPeriodo(IzakGestao.data.financeiro.contasPagar, filtros.dataInicio, filtros.dataFim);
            
            contasFiltradas.forEach(conta => {
                if(!conta.pago) {
                    dados.despesas.push({
                        data: new Date(conta.vencimento || conta.data),
                        descricao: conta.descricao,
                        valor: conta.valor,
                        categoria: conta.categoria || 'Despesa'
                    });
                    dados.saldo -= conta.valor;
                }
            });
        }
        
        // Ordena por data
        dados.receitas.sort((a, b) => b.data - a.data);
        dados.despesas.sort((a, b) => b.data - a.data);
        
        this.dadosRelatorio = dados;
        this.renderizarRelatorioFinanceiro();
    },
    
    gerarRelatorioVendas: function(filtros) {
        const dados = {
            resumo: {
                totalVendas: 0,
                quantidadeVendas: 0,
                mediaVenda: 0,
                maiorVenda: 0,
                menorVenda: Infinity
            },
            vendas: [],
            porFormaPagamento: {},
            porCliente: {}
        };
        
        // Filtra orçamentos no período
        const orcamentosFiltrados = this.filtrarPorPeriodo(IzakGestao.data.orcamentos, filtros.dataInicio, filtros.dataFim);
        
        orcamentosFiltrados.forEach(orc => {
            const valor = orc.total;
            
            // Resumo
            dados.resumo.totalVendas += valor;
            dados.resumo.quantidadeVendas++;
            
            if(valor > dados.resumo.maiorVenda) dados.resumo.maiorVenda = valor;
            if(valor < dados.resumo.menorVenda) dados.resumo.menorVenda = valor;
            
            // Detalhes da venda
            dados.vendas.push({
                data: new Date(orc.dataCriacao),
                numero: orc.numero,
                cliente: orc.cliente.nome,
                valor: valor,
                formaPagamento: orc.pagamento.forma,
                status: orc.status,
                itens: orc.itens.length
            });
            
            // Por forma de pagamento
            const forma = orc.pagamento.forma;
            dados.porFormaPagamento[forma] = (dados.porFormaPagamento[forma] || 0) + valor;
            
            // Por cliente
            const cliente = orc.cliente.nome;
            dados.porCliente[cliente] = (dados.porCliente[cliente] || 0) + valor;
        });
        
        // Calcula média
        if(dados.resumo.quantidadeVendas > 0) {
            dados.resumo.mediaVenda = dados.resumo.totalVendas / dados.resumo.quantidadeVendas;
        }
        
        // Ordena vendas por data (mais recente primeiro)
        dados.vendas.sort((a, b) => b.data - a.data);
        
        this.dadosRelatorio = dados;
        this.renderizarRelatorioVendas();
    },
    
    gerarRelatorioEstoque: function(filtros) {
        const dados = {
            resumo: {
                totalItens: IzakGestao.data.estoque.length,
                valorTotal: 0,
                itensBaixoEstoque: 0,
                itensSemEstoque: 0
            },
            itens: [],
            itensBaixoEstoque: [],
            porCategoria: {}
        };
        
        IzakGestao.data.estoque.forEach(item => {
            const valorItem = item.quantidade * item.preco;
            
            // Resumo
            dados.resumo.valorTotal += valorItem;
            
            if(item.quantidade <= item.estoqueMinimo) {
                dados.resumo.itensBaixoEstoque++;
            }
            
            if(item.quantidade === 0) {
                dados.resumo.itensSemEstoque++;
            }
            
            // Detalhes do item
            dados.itens.push({
                nome: item.nome,
                codigo: item.codigo,
                categoria: item.categoria,
                quantidade: item.quantidade,
                estoqueMinimo: item.estoqueMinimo,
                preco: item.preco,
                valorTotal: valorItem,
                status: item.quantidade <= item.estoqueMinimo ? 'baixo' : 
                       item.quantidade === 0 ? 'esgotado' : 'normal'
            });
            
            // Itens com baixo estoque
            if(item.quantidade <= item.estoqueMinimo) {
                dados.itensBaixoEstoque.push({
                    nome: item.nome,
                    codigo: item.codigo,
                    quantidade: item.quantidade,
                    estoqueMinimo: item.estoqueMinimo,
                    diferenca: item.estoqueMinimo - item.quantidade
                });
            }
            
            // Por categoria
            const categoria = item.categoria || 'Sem categoria';
            dados.porCategoria[categoria] = (dados.porCategoria[categoria] || 0) + item.quantidade;
        });
        
        // Ordena itens por valor total (maior primeiro)
        dados.itens.sort((a, b) => b.valorTotal - a.valorTotal);
        
        this.dadosRelatorio = dados;
        this.renderizarRelatorioEstoque();
    },
    
    gerarRelatorioProducao: function(filtros) {
        const dados = {
            resumo: {
                totalOS: IzakGestao.data.ordensServico.length,
                osPendentes: 0,
                osAndamento: 0,
                osConcluidas: 0,
                osAtrasadas: 0
            },
            ordens: [],
            porStatus: {},
            porCliente: {}
        };
        
        const hoje = new Date();
        
        IzakGestao.data.ordensServico.forEach(os => {
            // Resumo por status
            dados.resumo[`os${this.capitalize(os.status)}`]++;
            
            // Contagem por status
            dados.porStatus[os.status] = (dados.porStatus[os.status] || 0) + 1;
            
            // Verifica se está atrasada
            let statusAtraso = 'no prazo';
            if(os.prazoEntrega) {
                const prazo = new Date(os.prazoEntrega);
                if(prazo < hoje && (os.status === 'pendente' || os.status === 'andamento')) {
                    statusAtraso = 'atrasada';
                    dados.resumo.osAtrasadas++;
                }
            }
            
            // Detalhes da OS
            dados.ordens.push({
                numero: os.numero || `OS${os.id.substr(0, 8)}`,
                cliente: os.cliente || 'Não informado',
                descricao: os.descricao,
                status: os.status,
                dataCriacao: new Date(os.dataCriacao || os.data),
                prazoEntrega: os.prazoEntrega ? new Date(os.prazoEntrega) : null,
                valor: os.valor || 0,
                statusAtraso: statusAtraso
            });
            
            // Por cliente
            const cliente = os.cliente || 'Não informado';
            dados.porCliente[cliente] = (dados.porCliente[cliente] || 0) + 1;
        });
        
        // Ordena por data de criação (mais recente primeiro)
        dados.ordens.sort((a, b) => b.dataCriacao - a.dataCriacao);
        
        this.dadosRelatorio = dados;
        this.renderizarRelatorioProducao();
    },
    
    gerarRelatorioClientes: function(filtros) {
        const dados = {
            resumo: {
                totalClientes: 0,
                clientesAtivos: 0,
                clientesInativos: 0
            },
            clientes: [],
            topClientes: []
        };
        
        // Coleta clientes dos orçamentos
        const clientesMap = {};
        
        IzakGestao.data.orcamentos.forEach(orc => {
            const clienteNome = orc.cliente.nome;
            
            if(!clientesMap[clienteNome]) {
                clientesMap[clienteNome] = {
                    nome: clienteNome,
                    email: orc.cliente.email,
                    telefone: orc.cliente.telefone,
                    totalCompras: 0,
                    quantidadeOrcamentos: 0,
                    primeiroPedido: new Date(orc.dataCriacao),
                    ultimoPedido: new Date(orc.dataCriacao)
                };
            }
            
            const cliente = clientesMap[clienteNome];
            cliente.totalCompras += orc.total;
            cliente.quantidadeOrcamentos++;
            
            const dataOrcamento = new Date(orc.dataCriacao);
            if(dataOrcamento < cliente.primeiroPedido) cliente.primeiroPedido = dataOrcamento;
            if(dataOrcamento > cliente.ultimoPedido) cliente.ultimoPedido = dataOrcamento;
        });
        
        // Converte para array
        dados.clientes = Object.values(clientesMap);
        dados.resumo.totalClientes = dados.clientes.length;
        
        // Calcula clientes ativos (compraram nos últimos 30 dias)
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
        
        dados.clientes.forEach(cliente => {
            if(cliente.ultimoPedido >= trintaDiasAtras) {
                dados.resumo.clientesAtivos++;
            } else {
                dados.resumo.clientesInativos++;
            }
        });
        
        // Top clientes por valor gasto
        dados.topClientes = [...dados.clientes]
            .sort((a, b) => b.totalCompras - a.totalCompras)
            .slice(0, 10);
        
        this.dadosRelatorio = dados;
        this.renderizarRelatorioClientes();
    },
    
    gerarRelatorioLucroPrejuizo: function(filtros) {
        const dados = {
            receitaTotal: 0,
            despesaTotal: 0,
            lucroPrejuizo: 0,
            margemLucro: 0,
            detalhesReceitas: [],
            detalhesDespesas: []
        };
        
        // Receitas (orçamentos aprovados/concluídos no período)
        const orcamentosFiltrados = this.filtrarPorPeriodo(IzakGestao.data.orcamentos, filtros.dataInicio, filtros.dataFim)
            .filter(o => o.status === 'aprovado' || o.status === 'concluido');
        
        orcamentosFiltrados.forEach(orc => {
            dados.receitaTotal += orc.total;
            dados.detalhesReceitas.push({
                data: new Date(orc.dataCriacao),
                descricao: orc.descricao,
                cliente: orc.cliente.nome,
                valor: orc.total
            });
        });
        
        // Despesas (simuladas - você pode adaptar para seus dados reais)
        if(IzakGestao.data.financeiro && IzakGestao.data.financeiro.contasPagar) {
            const despesasFiltradas = this.filtrarPorPeriodo(IzakGestao.data.financeiro.contasPagar, filtros.dataInicio, filtros.dataFim);
            
            despesasFiltradas.forEach(despesa => {
                dados.despesaTotal += despesa.valor || 0;
                dados.detalhesDespesas.push({
                    data: new Date(despesa.vencimento || despesa.data),
                    descricao: despesa.descricao,
                    categoria: despesa.categoria || 'Despesa',
                    valor: despesa.valor || 0
                });
            });
        }
        
        // Cálculos
        dados.lucroPrejuizo = dados.receitaTotal - dados.despesaTotal;
        dados.margemLucro = dados.receitaTotal > 0 ? 
            (dados.lucroPrejuizo / dados.receitaTotal) * 100 : 0;
        
        this.dadosRelatorio = dados;
        this.renderizarRelatorioLucroPrejuizo();
    },
    
    filtrarPorPeriodo: function(dados, dataInicio, dataFim) {
        if(!dataInicio || !dataFim) return dados;
        
        return dados.filter(item => {
            const dataItem = new Date(item.dataCriacao || item.data || item.vencimento || item.dataAtualizacao);
            return dataItem >= dataInicio && dataItem <= dataFim;
        });
    },
    
    capitalize: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    
    formatarData: function(data) {
        if(!data) return 'Não informado';
        return new Date(data).toLocaleDateString('pt-BR');
    },
    
    formatarMoeda: function(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    },
    
    renderizarRelatorioFinanceiro: function() {
        const dados = this.dadosRelatorio;
        const filtros = this.filtrosAtuais;
        
        // Atualiza título
        document.getElementById('relatorio-titulo').textContent = 'Relatório Financeiro';
        document.getElementById('relatorio-periodo').textContent = 
            `Período: ${filtros.dataInicio.toLocaleDateString('pt-BR')} até ${filtros.dataFim.toLocaleDateString('pt-BR')}`;
        
        // Resumo
        const resumoHTML = `
            <div class="resumo-card">
                <h4>Receitas</h4>
                <p>${this.formatarMoeda(dados.receitas.reduce((sum, r) => sum + r.valor, 0))}</p>
            </div>
            <div class="resumo-card">
                <h4>Despesas</h4>
                <p>${this.formatarMoeda(dados.despesas.reduce((sum, d) => sum + d.valor, 0))}</p>
            </div>
            <div class="resumo-card ${dados.saldo >= 0 ? 'positivo' : 'negativo'}">
                <h4>Saldo</h4>
                <p>${this.formatarMoeda(dados.saldo)}</p>
            </div>
            <div class="resumo-card">
                <h4>Total de Transações</h4>
                <p>${dados.receitas.length + dados.despesas.length}</p>
            </div>
        `;
        
        document.getElementById('relatorio-resumo').innerHTML = resumoHTML;
        
        // Detalhes das receitas
        let detalhesHTML = `
            <h4>Receitas</h4>
            <table class="tabela-detalhes">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Cliente</th>
                        <th>Descrição</th>
                        <th>Forma Pagamento</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        dados.receitas.forEach(receita => {
            detalhesHTML += `
                <tr>
                    <td>${this.formatarData(receita.data)}</td>
                    <td>${receita.cliente}</td>
                    <td>${receita.descricao}</td>
                    <td>${receita.formaPagamento}</td>
                    <td>${this.formatarMoeda(receita.valor)}</td>
                </tr>
            `;
        });
        
        detalhesHTML += `
                <tr class="total-row">
                    <td colspan="4">Total Receitas</td>
                    <td>${this.formatarMoeda(dados.receitas.reduce((sum, r) => sum + r.valor, 0))}</td>
                </tr>
            </tbody>
            </table>
        `;
        
        // Detalhes das despesas
        if(dados.despesas.length > 0) {
            detalhesHTML += `
                <h4 style="margin-top: 30px;">Despesas</h4>
                <table class="tabela-detalhes">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Categoria</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            dados.despesas.forEach(despesa => {
                detalhesHTML += `
                    <tr>
                        <td>${this.formatarData(despesa.data)}</td>
                        <td>${despesa.descricao}</td>
                        <td>${despesa.categoria}</td>
                        <td>${this.formatarMoeda(despesa.valor)}</td>
                    </tr>
                `;
            });
            
            detalhesHTML += `
                    <tr class="total-row">
                        <td colspan="3">Total Despesas</td>
                        <td>${this.formatarMoeda(dados.despesas.reduce((sum, d) => sum + d.valor, 0))}</td>
                    </tr>
                </tbody>
                </table>
            `;
        }
        
        document.getElementById('relatorio-detalhes').innerHTML = detalhesHTML;
        
        // Gráfico simples (em HTML/CSS)
        const graficosHTML = `
            <h4>Fluxo Financeiro</h4>
            <div style="display: flex; align-items: flex-end; height: 200px; gap: 20px; margin-top: 20px;">
                <div style="flex: 1; text-align: center;">
                    <div style="height: ${Math.min(150, (dados.receitas.reduce((sum, r) => sum + r.valor, 0) / 1000) * 5)}px; background-color: var(--success-color); border-radius: 4px;"></div>
                    <div style="margin-top: 10px; font-size: 0.9em;">Receitas</div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <div style="height: ${Math.min(150, (dados.despesas.reduce((sum, d) => sum + d.valor, 0) / 1000) * 5)}px; background-color: var(--danger-color); border-radius: 4px;"></div>
                    <div style="margin-top: 10px; font-size: 0.9em;">Despesas</div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <div style="height: ${Math.min(150, (Math.abs(dados.saldo) / 1000) * 5)}px; background-color: ${dados.saldo >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}; border-radius: 4px;"></div>
                    <div style="margin-top: 10px; font-size: 0.9em;">Saldo</div>
                </div>
            </div>
        `;
        
        document.getElementById('relatorio-graficos').innerHTML = graficosHTML;
    },
    
    renderizarRelatorioVendas: function() {
        const dados = this.dadosRelatorio;
        const filtros = this.filtrosAtuais;
        
        // Atualiza título
        document.getElementById('relatorio-titulo').textContent = 'Relatório de Vendas';
        document.getElementById('relatorio-periodo').textContent = 
            `Período: ${filtros.dataInicio.toLocaleDateString('pt-BR')} até ${filtros.dataFim.toLocaleDateString('pt-BR')}`;
        
        // Resumo
        const resumoHTML = `
            <div class="resumo-card">
                <h4>Total de Vendas</h4>
                <p>${this.formatarMoeda(dados.resumo.totalVendas)}</p>
            </div>
            <div class="resumo-card">
                <h4>Quantidade de Vendas</h4>
                <p>${dados.resumo.quantidadeVendas}</p>
            </div>
            <div class="resumo-card">
                <h4>Média por Venda</h4>
                <p>${this.formatarMoeda(dados.resumo.mediaVenda)}</p>
            </div>
            <div class="resumo-card">
                <h4>Maior Venda</h4>
                <p>${this.formatarMoeda(dados.resumo.maiorVenda)}</p>
            </div>
        `;
        
        document.getElementById('relatorio-resumo').innerHTML = resumoHTML;
        
        // Detalhes das vendas
        let detalhesHTML = `
            <h4>Detalhes das Vendas</h4>
            <table class="tabela-detalhes">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Nº Orçamento</th>
                        <th>Cliente</th>
                        <th>Valor</th>
                        <th>Forma Pagamento</th>
                        <th>Status</th>
                        <th>Itens</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        dados.vendas.forEach(venda => {
            detalhesHTML += `
                <tr>
                    <td>${this.formatarData(venda.data)}</td>
                    <td>${venda.numero}</td>
                    <td>${venda.cliente}</td>
                    <td>${this.formatarMoeda(venda.valor)}</td>
                    <td>${venda.formaPagamento}</td>
                    <td><span class="status-badge status-${venda.status}">${venda.status}</span></td>
                    <td>${venda.itens}</td>
                </tr>
            `;
        });
        
        detalhesHTML += `
                <tr class="total-row">
                    <td colspan="3">Total</td>
                    <td>${this.formatarMoeda(dados.resumo.totalVendas)}</td>
                    <td colspan="3"></td>
                </tr>
            </tbody>
            </table>
        `;
        
        document.getElementById('relatorio-detalhes').innerHTML = detalhesHTML;
    },
    
    renderizarRelatorioEstoque: function() {
        const dados = this.dadosRelatorio;
        
        // Atualiza título
        document.getElementById('relatorio-titulo').textContent = 'Relatório de Estoque';
        document.getElementById('relatorio-periodo').textContent = 'Situação atual do estoque';
        
        // Resumo
        const resumoHTML = `
            <div class="resumo-card">
                <h4>Total de Itens</h4>
                <p>${dados.resumo.totalItens}</p>
            </div>
            <div class="resumo-card">
                <h4>Valor Total em Estoque</h4>
                <p>${this.formatarMoeda(dados.resumo.valorTotal)}</p>
            </div>
            <div class="resumo-card ${dados.resumo.itensBaixoEstoque > 0 ? 'negativo' : 'positivo'}">
                <h4>Itens com Estoque Baixo</h4>
                <p>${dados.resumo.itensBaixoEstoque}</p>
            </div>
            <div class="resumo-card ${dados.resumo.itensSemEstoque > 0 ? 'negativo' : 'positivo'}">
                <h4>Itens Esgotados</h4>
                <p>${dados.resumo.itensSemEstoque}</p>
            </div>
        `;
        
        document.getElementById('relatorio-resumo').innerHTML = resumoHTML;
        
        // Itens com baixo estoque
        if(dados.itensBaixoEstoque.length > 0) {
            let detalhesHTML = `
                <h4>⚠️ Itens com Estoque Baixo</h4>
                <table class="tabela-detalhes">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Código</th>
                            <th>Quantidade Atual</th>
                            <th>Estoque Mínimo</th>
                            <th>Falta</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            dados.itensBaixoEstoque.forEach(item => {
                detalhesHTML += `
                    <tr>
                        <td>${item.nome}</td>
                        <td>${item.codigo}</td>
                        <td>${item.quantidade}</td>
                        <td>${item.estoqueMinimo}</td>
                        <td>${item.diferenca}</td>
                    </tr>
                `;
            });
            
            detalhesHTML += `</tbody></table>`;
            document.getElementById('relatorio-detalhes').innerHTML = detalhesHTML;
        } else {
            document.getElementById('relatorio-detalhes').innerHTML = 
                '<p class="positivo">✅ Todos os itens estão com estoque adequado.</p>';
        }
    },
    
    renderizarRelatorioProducao: function() {
        const dados = this.dadosRelatorio;
        
        // Atualiza título
        document.getElementById('relatorio-titulo').textContent = 'Relatório de Produção';
        document.getElementById('relatorio-periodo').textContent = 'Status das Ordens de Serviço';
        
        // Resumo
        const resumoHTML = `
            <div class="resumo-card">
                <h4>Total de OS</h4>
                <p>${dados.resumo.totalOS}</p>
            </div>
            <div class="resumo-card ${dados.resumo.osPendentes > 0 ? 'negativo' : 'positivo'}">
                <h4>OS Pendentes</h4>
                <p>${dados.resumo.osPendentes}</p>
            </div>
            <div class="resumo-card">
                <h4>OS em Andamento</h4>
                <p>${dados.resumo.osAndamento}</p>
            </div>
            <div class="resumo-card ${dados.resumo.osAtrasadas > 0 ? 'negativo' : 'positivo'}">
                <h4>OS Atrasadas</h4>
                <p>${dados.resumo.osAtrasadas}</p>
            </div>
        `;
        
        document.getElementById('relatorio-resumo').innerHTML = resumoHTML;
        
        // Detalhes das OS
        if(dados.ordens.length > 0) {
            let detalhesHTML = `
                <h4>Ordens de Serviço</h4>
                <table class="tabela-detalhes">
                    <thead>
                        <tr>
                            <th>Nº OS</th>
                            <th>Cliente</th>
                            <th>Descrição</th>
                            <th>Status</th>
                            <th>Data Criação</th>
                            <th>Prazo Entrega</th>
                            <th>Situação</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            dados.ordens.forEach(os => {
                detalhesHTML += `
                    <tr>
                        <td>${os.numero}</td>
                        <td>${os.cliente}</td>
                        <td>${os.descricao}</td>
                        <td><span class="status-badge status-${os.status}">${os.status}</span></td>
                        <td>${this.formatarData(os.dataCriacao)}</td>
                        <td>${os.prazoEntrega ? this.formatarData(os.prazoEntrega) : 'Não informado'}</td>
                        <td><span class="${os.statusAtraso === 'atrasada' ? 'negativo' : 'positivo'}">${os.statusAtraso === 'atrasada' ? '⏰ Atrasada' : '✅ No prazo'}</span></td>
                    </tr>
                `;
            });
            
            detalhesHTML += `</tbody></table>`;
            document.getElementById('relatorio-detalhes').innerHTML = detalhesHTML;
        }
    },
    
    renderizarRelatorioClientes: function() {
        const dados = this.dadosRelatorio;
        
        // Atualiza título
        document.getElementById('relatorio-titulo').textContent = 'Relatório de Clientes';
        document.getElementById('relatorio-periodo').textContent = 'Análise de clientes da gráfica';
        
        // Resumo
        const resumoHTML = `
            <div class="resumo-card">
                <h4>Total de Clientes</h4>
                <p>${dados.resumo.totalClientes}</p>
            </div>
            <div class="resumo-card positivo">
                <h4>Clientes Ativos</h4>
                <p>${dados.resumo.clientesAtivos}</p>
            </div>
            <div class="resumo-card">
                <h4>Clientes Inativos</h4>
                <p>${dados.resumo.clientesInativos}</p>
            </div>
            <div class="resumo-card">
                <h4>Orçamentos por Cliente</h4>
                <p>${dados.resumo.totalClientes > 0 ? (dados.clientes.reduce((sum, c) => sum + c.quantidadeOrcamentos, 0) / dados.resumo.totalClientes).toFixed(1) : 0}</p>
            </div>
        `;
        
        document.getElementById('relatorio-resumo').innerHTML = resumoHTML;
        
        // Top clientes
        if(dados.topClientes.length > 0) {
            let detalhesHTML = `
                <h4>🏆 Top 10 Clientes</h4>
                <table class="tabela-detalhes">
                    <thead>
                        <tr>
                            <th>Posição</th>
                            <th>Cliente</th>
                            <th>Total Gasto</th>
                            <th>Orçamentos</th>
                            <th>Primeira Compra</th>
                            <th>Última Compra</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            dados.topClientes.forEach((cliente, index) => {
                detalhesHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${cliente.nome}</td>
                        <td>${this.formatarMoeda(cliente.totalCompras)}</td>
                        <td>${cliente.quantidadeOrcamentos}</td>
                        <td>${this.formatarData(cliente.primeiroPedido)}</td>
                        <td>${this.formatarData(cliente.ultimoPedido)}</td>
                    </tr>
                `;
            });
            
            detalhesHTML += `</tbody></table>`;
            document.getElementById('relatorio-detalhes').innerHTML = detalhesHTML;
        }
    },
    
    renderizarRelatorioLucroPrejuizo: function() {
        const dados = this.dadosRelatorio;
        const filtros = this.filtrosAtuais;
        
        // Atualiza título
        document.getElementById('relatorio-titulo').textContent = 'Relatório de Lucro/Prejuízo';
        document.getElementById('relatorio-periodo').textContent = 
            `Período: ${filtros.dataInicio.toLocaleDateString('pt-BR')} até ${filtros.dataFim.toLocaleDateString('pt-BR')}`;
        
        // Resumo
        const status = dados.lucroPrejuizo >= 0 ? 'positivo' : 'negativo';
        const resumoHTML = `
            <div class="resumo-card">
                <h4>Receita Total</h4>
                <p>${this.formatarMoeda(dados.receitaTotal)}</p>
            </div>
            <div class="resumo-card">
                <h4>Despesa Total</h4>
                <p>${this.formatarMoeda(dados.despesaTotal)}</p>
            </div>
            <div class="resumo-card ${status}">
                <h4>${dados.lucroPrejuizo >= 0 ? 'Lucro' : 'Prejuízo'}</h4>
                <p>${this.formatarMoeda(Math.abs(dados.lucroPrejuizo))}</p>
            </div>
            <div class="resumo-card ${status}">
                <h4>Margem ${dados.lucroPrejuizo >= 0 ? 'de Lucro' : ''}</h4>
                <p>${dados.margemLucro.toFixed(2)}%</p>
            </div>
        `;
        
        document.getElementById('relatorio-resumo').innerHTML = resumoHTML;
        
        // Gráfico
        const graficosHTML = `
            <h4>Análise Financeira</h4>
            <div style="max-width: 500px; margin: 20px auto;">
                <div style="display: flex; height: 30px; margin-bottom: 10px;">
                    <div style="flex: ${dados.receitaTotal}; background-color: var(--success-color); border-radius: 4px 0 0 4px;"></div>
                    <div style="flex: ${dados.despesaTotal}; background-color: var(--danger-color); border-radius: 0 4px 4px 0;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.9em;">
                    <span>Receitas: ${this.formatarMoeda(dados.receitaTotal)}</span>
                    <span>Despesas: ${this.formatarMoeda(dados.despesaTotal)}</span>
                </div>
            </div>
            <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: ${status === 'positivo' ? '#d4edda' : '#f8d7da'}; border-radius: 8px;">
                <h3 style="color: ${status === 'positivo' ? 'var(--success-color)' : 'var(--danger-color)'}">
                    ${status === 'positivo' ? '✅ LUCRO' : '❌ PREJUÍZO'}
                </h3>
                <p style="font-size: 1.2em; font-weight: bold;">${this.formatarMoeda(Math.abs(dados.lucroPrejuizo))}</p>
                <p>Margem: ${dados.margemLucro.toFixed(2)}%</p>
            </div>
        `;
        
        document.getElementById('relatorio-graficos').innerHTML = graficosHTML;
    },
    
    imprimirRelatorio: function() {
        window.print();
    },
    
    exportarRelatorio: function() {
        const formato = this.filtrosAtuais.formato || 'pdf';
        
        if(formato === 'pdf') {
            this.exportarParaPDF();
        } else if(formato === 'excel') {
            this.exportarParaExcel();
        }
    },
    
    exportarParaPDF: function() {
        alert('Para exportar para PDF, clique em "Imprimir" e selecione "Salvar como PDF" nas opções de impressão.');
    },
    
    exportarParaExcel: function() {
        const dados = this.dadosRelatorio;
        const tipo = this.filtrosAtuais.tipo;
        
        // Cria conteúdo CSV
        let csv = '';
        
        switch(tipo) {
            case 'financeiro':
                csv = 'Data,Cliente,Descrição,Forma Pagamento,Valor,Tipo\n';
                dados.receitas.forEach(r => {
                    csv += `${this.formatarData(r.data)},${r.cliente},${r.descricao},${r.formaPagamento},${r.valor},Receita\n`;
                });
                dados.despesas.forEach(d => {
                    csv += `${this.formatarData(d.data)},${d.descricao},${d.descricao},${d.categoria},${d.valor},Despesa\n`;
                });
                break;
                
            case 'vendas':
                csv = 'Data,Número,Cliente,Valor,Forma Pagamento,Status,Itens\n';
                dados.vendas.forEach(v => {
                    csv += `${this.formatarData(v.data)},${v.numero},${v.cliente},${v.valor},${v.formaPagamento},${v.status},${v.itens}\n`;
                });
                break;
        }
        
        // Cria blob e link para download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};