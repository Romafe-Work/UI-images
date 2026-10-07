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
