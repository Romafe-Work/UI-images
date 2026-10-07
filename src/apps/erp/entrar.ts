/* =========================================================
   ERP — o que o início de sessão tem de próprio no Rolgest
   O processo, o cartão e o texto de apresentação são os comuns
   (src/comum/entrar); aqui só a marca, a versão e o realm.
   ========================================================= */
import type { OpcoesEntrar } from '../../comum/entrar/entrar';

export const entrarErp: OpcoesEntrar = {
  variante: 'completa',
  marca: { nome: 'ROLGEST', sub: 'Plataforma de gestão' },
  produto: 'Rolgest',
  versao: 'Rolgest 10.0 · compilação 2026.09',
  realm: 'rolgest',
};
