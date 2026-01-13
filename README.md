# Izak Comunicação Visual - Sistema de Gestão

O programa está em teste

## 📱 Responsividade

O aplicativo agora é **totalmente responsivo** e funciona perfeitamente em:

### 💻 Desktop (1440px+)
- Layout completo com sidebar fixa
- Dashboard com até 4 colunas
- Visualização otimizada para telas grandes

### 🖥️ Desktop Médio (1024px - 1440px)
- Sidebar fixa
- Dashboard com 3 colunas
- Todos os recursos acessíveis

### 📱 Tablet (768px - 1024px)
- Sidebar transformada em menu lateral retrátil
- Dashboard com 2 colunas
- Menu acionado por botão (☰)
- Overlay escuro ao abrir menu

### 📱 Smartphone (480px - 768px)
- Menu lateral com botão de toggle
- Dashboard em coluna única
- Tabelas com scroll horizontal
- Formulários empilhados verticalmente
- Botões full-width para melhor usabilidade

### 📱 Smartphone Pequeno (até 480px)
- Interface otimizada para telas menores
- Inputs com fonte mínima de 16px (evita zoom automático no iOS)
- Elementos com tamanhos reduzidos
- Máxima usabilidade em telas pequenas

## 🎯 Funcionalidades Responsivas

- **Menu Mobile**: Botão ☰ para abrir/fechar sidebar
- **Overlay**: Fundo escuro ao abrir menu (fecha ao clicar)
- **Touch-Friendly**: Áreas de toque adequadas para mobile
- **Scroll Horizontal**: Tabelas adaptadas para não quebrar layout
- **Formulários Adaptativos**: Campos empilhados em telas pequenas
- **Navegação por Teclado**: Suporte a ESC para fechar menu
- **Landscape Mode**: Suporte a orientação horizontal

## 🔧 Melhorias Implementadas

1. ✅ Media queries para múltiplos breakpoints
2. ✅ Menu mobile com toggle button
3. ✅ Overlay para fechar menu
4. ✅ Sidebar retrátil em mobile
5. ✅ Grid responsivo no dashboard
6. ✅ Tabelas com scroll horizontal
7. ✅ Formulários adaptáveis
8. ✅ Botões full-width em mobile
9. ✅ Inputs com fonte adequada (evita zoom iOS)
10. ✅ Login responsivo

## 📐 Breakpoints Utilizados

```css
/* Desktop Grande */
@media (min-width: 1440px)

/* Tablet */
@media (max-width: 1024px)

/* Tablet Pequeno / Mobile Grande */
@media (max-width: 768px)

/* Mobile Pequeno */
@media (max-width: 480px)

/* Landscape */
@media (max-width: 768px) and (orientation: landscape)
```
