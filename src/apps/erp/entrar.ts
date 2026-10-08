/* =========================================================
   ERP — o que o início de sessão tem de próprio no Rolgest
   O processo e o cartão são os comuns (src/comum/entrar); aqui a marca,
   a versão, o realm e o que o Rolgest diz de si à entrada.
   ========================================================= */
import type { OpcoesEntrar } from '../../comum/entrar/entrar';

export const entrarErp: OpcoesEntrar = {
  variante: 'completa',
  familia: 'interna',
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

/** Na v7 não se diz Rolgest: diz-se Romafe (ela, 8 out. 2026). O nome no
    cartão é o ROMAFE em Motor, e a versão e o realm deixam de levar o Rolgest. */
export const entrarErpV7: Partial<OpcoesEntrar> = {
  produto: 'Romafe',
  feminino: true,
  nomeRomafe: true,
  versao: 'Versão 10.0 · compilação 2026.09',
  realm: 'romafe',
};
