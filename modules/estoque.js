// Módulo de Controle de Estoque
const EstoqueModule = {
    init: function() {
        this.renderEstoqueList();
        this.bindEvents();
        this.loadCategories();
    },
    
    bindEvents: function() {
        // Botão para adicionar novo item (procura por classe ou id para compatibilidade)
        const estoqueAddBtn = document.querySelector('[data-module="estoque"] .add-item-btn') || document.getElementById('add-item-btn');
        if(estoqueAddBtn) {
            estoqueAddBtn.addEventListener('click', () => {
                this.showItemForm();
            });
        }

        // Formulário de salvamento
        const itemForm = document.getElementById('item-form');
        if(itemForm) {
            itemForm.addEventListener('submit', (e) => {
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
            cancelBtn.addEventListener('click', () => {
                this.hideItemForm();
            });
        }

        // Filtro de pesquisa
        const searchItem = document.getElementById('search-item');
        if(searchItem) {
            searchItem.addEventListener('input', (e) => {
                this.filterItems(e.target.value);
            });
        }

        // Filtro por categoria
        const filterCategory = document.getElementById('filter-category');
        if(filterCategory) {
            filterCategory.addEventListener('change', (e) => {
                this.filterByCategory(e.target.value);
            });
        }
    },
    
    showItemForm: function(item = null) {
        const form = document.getElementById('item-form');
        form.reset();

        if(item) {
            // Modo edição
            form.dataset.id = item.id;
            document.getElementById('item-id').value = item.id; // <-- Adicionado
            document.getElementById('item-nome').value = item.nome;
            document.getElementById('item-codigo').value = item.codigo;
            document.getElementById('item-categoria').value = item.categoria;
            document.getElementById('item-quantidade').value = item.quantidade;
            document.getElementById('item-minimo').value = item.estoqueMinimo;
            document.getElementById('item-preco').value = item.preco;
            document.getElementById('item-descricao').value = item.descricao;
            document.getElementById('form-title').textContent = 'Editar Item';
        } else {
            // Modo criação
            form.removeAttribute('data-id');
            document.getElementById('item-id').value = ''; // <-- Adicionado
            document.getElementById('form-title').textContent = 'Adicionar Item';
        }

        document.getElementById('item-form-container').classList.remove('hidden');
        document.getElementById('estoque-list-container').classList.add('hidden');
    },
    
    hideItemForm: function() {
        document.getElementById('item-form-container').classList.add('hidden');
        document.getElementById('estoque-list-container').classList.remove('hidden');
    },
    
    saveItem: function() {
        const form = document.getElementById('item-form');
        const formData = new FormData(form);

        const id = formData.get('id') || Date.now().toString(); // <-- Corrigido
        const item = {
            id: id,
            nome: formData.get('nome'),
            codigo: formData.get('codigo'),
            categoria: formData.get('categoria'),
            quantidade: parseFloat(formData.get('quantidade')),
            estoqueMinimo: parseFloat(formData.get('minimo')),
            preco: parseFloat(formData.get('preco')),
            descricao: formData.get('descricao'),
            dataAtualizacao: new Date().toISOString()
        };


        // Atualiza ou adiciona o item
        const index = IzakGestao.data.estoque.findIndex(i => i.id === item.id);
        if(index >= 0) {
            IzakGestao.data.estoque[index] = item;
        } else {
            IzakGestao.data.estoque.push(item);
        }

        IzakGestao.saveData();
        this.renderEstoqueList();
        this.loadCategories();
        this.hideItemForm();
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
            categoriesSelect.appendChild(option);
            
            // Adiciona ao datalist
            const datalistOption = document.createElement('option');
            datalistOption.value = category;
            categoriesDatalist.appendChild(datalistOption);
        });
    },
    
    filterItems: function(searchTerm) {
        const items = document.querySelectorAll('.estoque-item');
        const term = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const itemName = item.querySelector('.item-info h3').textContent.toLowerCase();
            const itemCode = item.querySelector('.item-code').textContent.toLowerCase();
            const itemDesc = item.querySelector('.item-desc').textContent.toLowerCase();
            
            if(itemName.includes(term) || itemCode.includes(term) || itemDesc.includes(term)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
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
            
            container.appendChild(itemElement);
        });
        
        // Adiciona eventos aos botões
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const item = IzakGestao.data.estoque.find(i => i.id === id);
                this.showItemForm(item);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                this.deleteItem(id);
            });
        });
    }
};