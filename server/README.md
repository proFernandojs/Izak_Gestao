# Backend de Boletos (Mock + Template)

Este projeto fornece um backend mínimo para emissão de boletos, pensado como **template** para integrar com provedores reais (Gerencianet, Asaas, Pagar.me, PagSeguro, bancos com CNAB etc.). No estado atual, ele funciona em modo **MOCK** e retorna dados simulados (linha digitável, PDF placeholder, etc.).

## Requisitos
- Node.js 18+
- Configurar `.env` a partir de `.env.example`

## Instalação

```bash
cd server
npm install
cp .env.example .env
# edite .env conforme seu ambiente
npm start
```

Servidor sobe em `http://localhost:3000`.

## Endpoints
- `POST /api/boletos` — emite boleto (PAGBANK ou MOCK)
- `GET /api/boletos/:id` — consulta boleto (tenta provider, cai no cache)
- `POST /api/boletos/:id/cancel` — cancela boleto
- `POST /webhooks/boletos` — webhook de confirmação de pagamento

## Integração com o Frontend
Use o serviço em [modules/boleto.js](../modules/boleto.js):

```js
const boleto = await BoletoService.emitir({
  valor: 123.45,
  vencimento: '2026-02-10',
  pagador: { nome: 'Fulano', documento: '000.000.000-00' },
  referencia: 'ORC-000123'
});
console.log(boleto.linhaDigitavel);
window.open(boleto.pdfUrl);
```

## PagBank
- Configure `.env`:
  - `PROVIDER=PAGBANK`
  - `PAGBANK_TOKEN=seu_token`
  - `PAGBANK_SECRET=` (se não usar, deixe vazio)
- Endereço fallback do pagador (caso cliente não tenha endereço completo):
  - `PAGADOR_STREET=Rua Piratininga Qd 56 Lt 3a`
  - `PAGADOR_NUMBER=56`
  - `PAGADOR_DISTRICT=Vila Jaiara`
  - `PAGADOR_CITY=Anápolis`
  - `PAGADOR_UF=GO`
  - `PAGADOR_CEP=75064020`
- Endpoints usados: `https://api.pagseguro.com/charges` (emitir), `/charges/:id` (consultar), `/charges/:id/cancel` (cancelar)
- Webhook: aponte para `/webhooks/boletos` e marque evento de pagamento (status `PAID`)

## Próximos Passos (Aprimorar)
1. Mapear erros do PagBank e retornar mensagens amigáveis
2. Persistir boletos em storage real (DB) em vez de memória
3. Validar endereço/CEP do pagador para maior taxa de aprovação
4. Tratar juros/multa e abatimento conforme regras da conta PagBank
