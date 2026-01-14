// Serviço de integração de boletos (frontend)
// Abstrai chamadas ao backend para emissão/consulta/cancelamento

const BoletoService = {
  baseUrl: 'http://localhost:3000', // ajuste conforme seu deploy

  emitir: async function({ valor, vencimento, pagador, instrucoes = '', nossoNumero = '', referencia = '' }) {
    try {
      const resp = await fetch(`${this.baseUrl}/api/boletos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor, vencimento, pagador, instrucoes, nossoNumero, referencia })
      });
      if (!resp.ok) throw new Error(`Falha ao emitir boleto: ${resp.status}`);
      const data = await resp.json();
      return data; // { id, linhaDigitavel, pdfUrl, status, ... }
    } catch (err) {
      console.error('Erro BoletoService.emitir', err);
      throw err;
    }
  },

  consultar: async function(id) {
    try {
      const resp = await fetch(`${this.baseUrl}/api/boletos/${id}`);
      if (!resp.ok) throw new Error(`Falha ao consultar boleto: ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.error('Erro BoletoService.consultar', err);
      throw err;
    }
  },

  cancelar: async function(id) {
    try {
      const resp = await fetch(`${this.baseUrl}/api/boletos/${id}/cancel`, { method: 'POST' });
      if (!resp.ok) throw new Error(`Falha ao cancelar boleto: ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.error('Erro BoletoService.cancelar', err);
      throw err;
    }
  }
};

// Exemplo de uso (você pode chamar nos módulos Financeiro/Orçamentos):
// const boleto = await BoletoService.emitir({
//   valor: 123.45,
//   vencimento: '2026-02-10',
//   pagador: { nome: 'Fulano', documento: '000.000.000-00', email: 'f@ex.com', telefone: '(11) 99999-9999', endereco: { logradouro: 'Rua X', numero: '123', bairro: 'Centro', cidade: 'SP', uf: 'SP', cep: '01000-000' } },
//   instrucoes: 'Não receber após 30 dias. Juros 1% a.m.',
//   referencia: 'ORC-000123'
// });
// console.log('Linha digitável:', boleto.linhaDigitavel);
// window.open(boleto.pdfUrl, '_blank');
