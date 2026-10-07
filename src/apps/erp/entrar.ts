/* =========================================================
   ERP — o que o início de sessão tem de próprio no Rolgest
   O processo e o cartão são os comuns (src/comum/entrar); aqui a marca,
   a versão, o realm e o que o Rolgest diz de si à entrada.
   ========================================================= */
import type { OpcoesEntrar } from '../../comum/entrar/entrar';

export const entrarErp: OpcoesEntrar = {
  variante: 'completa',
  marca: { nome: 'ROLGEST', sub: 'Plataforma de gestão' },
  produto: 'Rolgest',
  versao: 'Rolgest 10.0 · compilação 2026.09',
  realm: 'rolgest',
  apresentacao: {
    titulo: 'A gestão<br>de todas as empresas<br>do grupo',
    vantagens: [
      { icone: 'empresa', titulo: 'Uma empresa de cada vez', sub: 'Escolhe-se ao entrar e troca-se sem sair' },
      { icone: 'separadores', titulo: 'Vendas, compras e stock', sub: 'Cada documento abre no seu separador' },
      { icone: 'procura', titulo: 'Tudo à mão com Ctrl K', sub: 'Abre qualquer ecrã ou documento da empresa ativa' },
    ],
  },
};
