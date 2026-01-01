// Módulo de Controle de Estoque
const EstoqueModule = {
    init: function() {
        console.log('EstoqueModule iniciando...');
        this.renderEstoqueList();
        this.bindEvents();
        this.loadCategories();
    },
    
    bindEvents: function() {
        console.log('Binding events do EstoqueModule...');
        // Botão para adicionar novo item (procura por classe ou id para compatibilidade)
        const estoqueAddBtn = document.querySelector('[data-module="estoque"] .add-item-btn') || document.getElementById('add-item-btn');
        console.log('Botão encontrado:', estoqueAddBtn);
        if(estoqueAddBtn) {
            estoqueAddBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Previne propagação para elementos pais
                console.log('Clique no botão Adicionar Item');
                this.showItemForm();
            });
        } else {
            console.warn('Botão "Adicionar Item" não encontrado');
        }

        // Formulário de salvamento
        const itemForm = document.getElementById('item-form');
        console.log('Formulário encontrado:', itemForm);
        if(itemForm) {
            // Previne propagação de cliques no formulário
            itemForm.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            itemForm.addEventListener('submit', (e) => {
                console.log('Submit do formulário acionado');
                if(!itemForm.checkValidity()) {
                    itemForm.reportValidity();
                    return;
                }
                e.preventDefault();
                this.saveItem();
            });

            // Listener direto no botão submit para garantir captura do clique
            const submitBtn = itemForm.querySelector('button[type="submit"]');
            if(submitBtn) {
                submitBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation(); // Previne propagação
                    // Garante que o evento submit do form seja disparado
                    if(typeof itemForm.requestSubmit === 'function') {
                        itemForm.requestSubmit();
                    } else {
                        itemForm.submit();
                    }
                });
            }
        }

        // Cancelar formulário
        const cancelBtn = document.getElementById('cancel-item-btn');
        if(cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Previne propagação
                this.hideItemForm();
            });
        }

        // Filtro de pesquisa
        const searchItem = document.getElementById('search-item');
        if(searchItem) {
            searchItem.addEventListener('click', (e) => {
                e.stopPropagation(); // Previne propagação no clique
            });
            searchItem.addEventListener('input', (e) => {
                e.stopPropagation(); // Previne propagação
                this.filterItems(e.target.value);
            });
        }

        // Filtro por categoria
        const filterCategory = document.getElementById('filter-category');
        if(filterCategory) {
            filterCategory.addEventListener('click', (e) => {
                e.stopPropagation(); // Previne propagação no clique
            });
            filterCategory.addEventListener('change', (e) => {
                e.stopPropagation(); // Previne propagação
                this.filterByCategory(e.target.value);
            });
        }
        
        // Previne propagação na container de filtros
        const filterContainer = document.querySelector('.estoque-filters');
        if(filterContainer) {
            filterContainer.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    },
    
    showItemForm: function(item = null) {
        console.log('showItemForm chamado', item);
        try {
            const form = document.getElementById('item-form');
            console.log('Form obtido:', form);
            form.reset();
            console.log('Form resetado');

            if(item) {
                // Modo edição
                form.dataset.id = item.id;
                document.getElementById('item-id').value = item.id;
                document.getElementById('item-nome').value = item.nome;
                document.getElementById('item-codigo').value = item.codigo;
                document.getElementById('item-categoria').value = item.categoria;
                document.getElementById('item-quantidade').value = item.quantidade;
                document.getElementById('item-minimo').value = item.estoqueMinimo;
                document.getElementById('item-preco').value = item.preco;
                document.getElementById('item-custo').value = item.custo || '';
                document.getElementById('item-descricao').value = item.descricao;
                document.getElementById('form-title').textContent = 'Editar Item';
            } else {
                // Modo criação
                form.removeAttribute('data-id');
                document.getElementById('item-id').value = '';
                document.getElementById('form-title').textContent = 'Adicionar Item';
            }

            const formContainer = document.getElementById('item-form-container');
            const listContainer = document.getElementById('estoque-list-container');
            console.log('Containers obtidos:', formContainer, listContainer);
            
            formContainer.classList.remove('hidden');
            listContainer.classList.add('hidden');
            console.log('showItemForm concluído com sucesso');
        } catch(error) {
            console.error('Erro em showItemForm:', error);
            console.error('Stack:', error.stack);
        }
    },
    
    hideItemForm: function() {
        document.getElementById('item-form-container').classList.add('hidden');
        document.getElementById('estoque-list-container').classList.remove('hidden');
    },
    
    saveItem: function() {
        console.log('saveItem chamado');
        try {
            const form = document.getElementById('item-form');
            const formData = new FormData(form);

            const id = formData.get('id') || Date.now().toString();
            const item = {
                id: id,
                nome: formData.get('nome'),
                codigo: formData.get('codigo'),
                categoria: formData.get('categoria'),
                quantidade: parseFloat(formData.get('quantidade')),
                estoqueMinimo: parseFloat(formData.get('minimo')),
                preco: parseFloat(formData.get('preco')),
                custo: parseFloat(formData.get('custo')) || 0,
                descricao: formData.get('descricao'),
                dataAtualizacao: new Date().toISOString()
            };
            console.log('Item a salvar:', item);

            // Atualiza ou adiciona o item
            const index = IzakGestao.data.estoque.findIndex(i => i.id === item.id);
            if(index >= 0) {
                console.log('Atualizando item existente no índice:', index);
                IzakGestao.data.estoque[index] = item;
            } else {
                console.log('Adicionando novo item');
                IzakGestao.data.estoque.push(item);
            }

            console.log('Salvando dados...');
            IzakGestao.saveData();
            console.log('Dados salvos. Renderizando lista...');
            
            this.renderEstoqueList();
            console.log('Lista renderizada. Carregando categorias...');
            
            this.loadCategories();
            console.log('Categorias carregadas. Ocultando formulário...');
            
            this.hideItemForm();
            console.log('Item salvo com sucesso!');
        } catch(error) {
            console.error('Erro em saveItem:', error);
            console.error('Stack:', error.stack);
        }
    },
    
    deleteItem: function(id) {
        if(confirm('Tem certeza que deseja excluir este item?')) {
            IzakGestao.data.estoque = IzakGestao.data.estoque.filter(item => item.id !== id);
            IzakGestao.saveData();
            this.renderEstoqueList();
            this.loadCategories();
        }
    },
    
    loadCategories: function() {
        const categoriesSelect = document.getElementById('filter-category');
        const categoriesDatalist = document.getElementById('categories');
        
        // Limpa as opções existentes (exceto a primeira)
        while(categoriesSelect.options.length > 1) {
            categoriesSelect.remove(1);
        }
        
        categoriesDatalist.innerHTML = '';
        
        // Obtém todas as categorias únicas
        const categories = [...new Set(IzakGestao.data.estoque.map(item => item.categoria).filter(Boolean))];
        
        // Adiciona ao select e ao datalist
        categories.forEach(category => {
            // Adiciona ao select
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category; // Adiciona o texto visível
            categoriesSelect.appendChild(option);
            
            // Adiciona ao datalist
            const datalistOption = document.createElement('option');
            datalistOption.value = category;
            categoriesDatalist.appendChild(datalistOption);
        });
    },
    
    filterItems: function(searchTerm) {
        console.log('filterItems chamado com termo:', searchTerm);
        const items = document.querySelectorAll('.estoque-item');
        console.log('Total de itens encontrados:', items.length);
        const term = searchTerm.toLowerCase().trim();
        
        let visibleCount = 0;
        items.forEach(item => {
            try {
                const itemName = item.querySelector('.item-info h3').textContent.toLowerCase();
                const itemCodeEl = item.querySelector('.item-code');
                const itemDescEl = item.querySelector('.item-desc');
                
                const itemCode = itemCodeEl ? itemCodeEl.textContent.toLowerCase() : '';
                const itemDesc = itemDescEl ? itemDescEl.textContent.toLowerCase() : '';
                
                console.log('Comparando:', {nome: itemName, codigo: itemCode, desc: itemDesc, termo: term});
                
                if(itemName.includes(term) || itemCode.includes(term) || itemDesc.includes(term)) {
                    item.style.display = '';
                    visibleCount++;
                } else {
                    item.style.display = 'none';
                }
            } catch(error) {
                console.error('Erro ao filtrar item:', error);
            }
        });
        console.log('Itens visíveis após filtro:', visibleCount);
    },
    
    filterByCategory: function(category) {
        if(!category) {
            // Mostra todos se nenhuma categoria selecionada
            document.querySelectorAll('.estoque-item').forEach(item => {
                item.style.display = '';
            });
            return;
        }
        
        document.querySelectorAll('.estoque-item').forEach(item => {
            const itemCategory = item.querySelector('.item-category').textContent;
            if(itemCategory === category) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    renderEstoqueList: function() {
        const container = document.getElementById('estoque-list');
        container.innerHTML = '';
        
        // Ordena por nome
        const items = [...IzakGestao.data.estoque].sort((a, b) => a.nome.localeCompare(b.nome));
        
        if(items.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhum item cadastrado no estoque.</p>';
            return;
        }
        
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'estoque-item';
            itemElement.innerHTML = `
                <div class="item-info">
                    <h3>${item.nome} <span class="item-code">#${item.codigo}</span></h3>
                    <p class="item-category">${item.categoria || 'Sem categoria'}</p>
                    <p class="item-desc">${item.descricao || 'Sem descrição'}</p>
                </div>
                <div class="item-stock">
                    <span class="stock-quantity ${item.quantidade <= item.estoqueMinimo ? 'low-stock' : ''}">
                        ${item.quantidade} ${item.quantidade <= item.estoqueMinimo ? '⚠️' : ''}
                    </span>
                    <span class="stock-min">Mín: ${item.estoqueMinimo}</span>
                </div>
                <div class="item-price">
                    R$ ${(Number(item.preco) || 0).toFixed(2)}

                </div>
                <div class="item-actions">
                    <button class="btn-edit" data-id="${item.id}">Editar</button>
                    <button class="btn-delete" data-id="${item.id}">Excluir</button>
                </div>
            `;
            
            // Previne propagação de cliques no item
            itemElement.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            container.appendChild(itemElement);
        });
        
        // Adiciona eventos aos botões
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Previne propagação
                const id = e.target.getAttribute('data-id');
                const item = IzakGestao.data.estoque.find(i => i.id === id);
                this.showItemForm(item);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Previne propagação
                const id = e.target.getAttribute('data-id');
                this.deleteItem(id);
            });
        });
    }
};