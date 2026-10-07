/* =========================================================
   MOBILE — o início de sessão na versão compacta
   Só o cartão: sem fotografia, sem texto de apresentação, sem tema nem
   idioma, sem apoio, sem rodapé e sem «manter sessão» (o aparelho é de todos).
   ========================================================= */
import type { OpcoesEntrar } from '../../comum/entrar/entrar';

export const entrarMobile: OpcoesEntrar = {
  variante: 'compacta',
  marca: { nome: 'ROMAFE', sub: 'Mobile' },
  produto: 'Romafe',
};

/** v2, sem a Romafe. A app ainda não tem nome: fica «Mobile», provisório,
    e muda-se aqui quando houver. */
export const entrarMobileNeutro: OpcoesEntrar = {
  variante: 'compacta',
  marca: { nome: 'Mobile', sub: 'Armazém' },
  produto: 'Mobile',
  semRomafe: true,
};
