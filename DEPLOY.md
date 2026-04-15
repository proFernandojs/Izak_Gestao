# Guia de Instalacao Local no Cliente

## Visao Geral

Este sistema pode rodar sem Railway, Render ou banco online.
Os usuarios ficam salvos localmente no computador servidor, no arquivo `server/data/users.json`.

O funcionamento fica assim:

- Um computador da empresa fica como servidor local.
- Esse computador precisa ficar ligado durante o horario de uso.
- Os demais computadores e celulares da mesma rede acessam pelo navegador.
- Se o computador servidor desligar, os outros usuarios param de acessar ate ele voltar.

---

## O Que Instalar no Computador do Cliente

No computador que vai servir o sistema, instale:

1. Node.js 18 ou superior.
2. A pasta completa do projeto.
3. As dependencias do backend com `npm install` dentro da pasta `server`.

Nao precisa instalar banco de dados externo.
Nao precisa contratar hospedagem.

---

## Onde Os Dados Ficam Salvos

Os usuarios ficam gravados em:

```text
server/data/users.json
```

Os dados principais do sistema (clientes, estoque, orcamentos, OS e financeiro) ficam em:

```text
server/data/app-data.json
```

Esses dois arquivos precisam entrar na rotina de backup do cliente.

---

## Passo a Passo de Instalacao

### Instalacao Rapida (Recomendada)

O projeto ja inclui um instalador unico:

```text
instalador-cliente.bat
```

Execute esse arquivo no computador servidor do cliente.
Ele faz automaticamente:

1. Verifica se o Node.js esta instalado.
2. Roda `npm install` na pasta `server`.
3. Ativa inicializacao automatica no Windows.
4. Cria atalho de backup na area de trabalho.
5. Cria atalho para iniciar servidor na area de trabalho.

Se preferir fazer tudo manualmente, siga os passos abaixo.

### 1. Instalar o Node.js

Baixe e instale o Node.js LTS:

https://nodejs.org

Depois confirme no Prompt ou PowerShell:

```bash
node -v
npm -v
```

### 2. Copiar o projeto para o computador do cliente

Exemplo:

```text
C:\GraficaHome
```

### 3. Instalar as dependencias do servidor

Abra o terminal dentro da pasta `server`:

```bash
cd C:\GraficaHome\server
npm install
```

### 4. Iniciar o servidor local

Ainda dentro da pasta `server`:

```bash
node server.js
```

Se estiver tudo certo, o sistema ficara disponivel em:

```text
http://localhost:3000/login.html
```

---

## Como Acessar Pela Rede Local

### 1. Descobrir o IP do computador servidor

No Windows:

```bash
ipconfig
```

Procure o IPv4 da rede local, por exemplo:

```text
192.168.0.50
```

### 2. Abrir o sistema nos outros computadores

Nos outros computadores da mesma rede, abra:

```text
http://192.168.0.50:3000/login.html
```

No celular conectado ao mesmo Wi-Fi:

```text
http://192.168.0.50:3000/login.html
```

---

## Liberar No Firewall Do Windows

Se os outros dispositivos nao conseguirem acessar, libere a porta 3000 no Windows Firewall.

Resumo do processo:

1. Abra `Firewall do Windows com Seguranca Avancada`.
2. Entre em `Regras de Entrada`.
3. Crie uma nova regra para `Porta`.
4. Escolha `TCP`.
5. Informe a porta `3000`.
6. Permita a conexao.
7. Marque pelo menos `Rede Privada`.

---

## Como Entregar Ao Cliente

O formato mais simples e este:

1. Escolher um computador fixo da empresa como servidor.
2. Deixar o projeto instalado nele.
3. Deixar um atalho para iniciar o servidor.
4. Orientar o cliente a abrir o sistema pelo IP desse computador.

Exemplo de acesso:

```text
http://192.168.0.50:3000/login.html
```

---

## Como Fazer O Servidor Iniciar Todo Dia

Voce tem tres opcoes praticas.

### Opcao 1: Manual

Todo dia, alguem abre o terminal e executa:

```bash
cd C:\GraficaHome\server
node server.js
```

### Opcao 2: Arquivo .bat

O projeto ja inclui o arquivo:

```text
iniciar-servidor.bat
```

Basta dar duplo clique nele para iniciar o servidor.

Se preferir criar manualmente, use:

```bat
cd /d C:\GraficaHome\server
node server.js
pause
```

Assim o cliente so precisa dar duplo clique.

### Opcao 3: Iniciar com o Windows

Para ativar automaticamente, o projeto ja inclui:

```text
ativar-inicializacao-windows.bat
```

Esse arquivo instala a inicializacao automatica no Windows para o usuario atual.

Para desativar depois, use:

```text
desativar-inicializacao-windows.bat
```

Detalhe tecnico: a inicializacao chama o arquivo `iniciar-servidor-background.vbs`, que sobe o servidor em segundo plano e grava log em `server/server-autostart.log`.

Isso e melhor para evitar esquecer de abrir o sistema no inicio do expediente.

---

## Backup Recomendado

Os arquivos mais importantes sao:

```text
server/data/users.json
server/data/app-data.json
```

Copie esses arquivos regularmente para outra pasta, pendrive, HD externo ou nuvem do proprio cliente.

Para facilitar, o projeto ja inclui:

```text
backup-dados.bat
```

Ao executar esse arquivo, o sistema cria uma pasta em `backups` com data e hora, contendo:

```text
users.json
app-data.json
```

---

## Limites Deste Modelo Local

Esse modelo e bom quando o sistema sera usado apenas na empresa e durante o horario comercial.

Limitacoes:

1. Se o computador servidor desligar, o sistema para para os outros usuarios.
2. Se a rede local cair, o acesso compartilhado para.
3. Se quiser acesso de fora da empresa, ai sim precisa de hospedagem externa ou VPN.

---

## Checklist De Entrega

- [ ] Node.js instalado no computador servidor
- [ ] Projeto copiado para o computador servidor
- [ ] `npm install` executado em `server`
- [ ] Servidor testado com `node server.js`
- [ ] Porta 3000 liberada no firewall
- [ ] IP local identificado
- [ ] Teste feito em outro computador da rede
- [ ] Backup de `server/data/users.json` definido
- [ ] Backup de `server/data/app-data.json` definido
- [ ] Inicializacao automatica ativada (opcional)

---

## Suporte Rapido

### Outros computadores nao acessam

Verifique:

1. Se o computador servidor esta ligado.
2. Se `node server.js` continua rodando.
3. Se a porta 3000 esta liberada no firewall.
4. Se o IP do servidor mudou.

### O sistema abre no servidor, mas nao em outra maquina

Normalmente isso e firewall, antivirus ou IP incorreto.

### Os dados sumiram

Verifique os arquivos:

```text
server/data/users.json
server/data/app-data.json
```

---

## Observacao Final

Para uso local, abra sempre o sistema pelo proprio servidor Node, por exemplo:

```text
http://localhost:3000/login.html
```

ou pela rede:

```text
http://IP-DO-SERVIDOR:3000/login.html
```

Assim o frontend e a API usam o mesmo endereco e a autenticacao funciona corretamente na rede local.
