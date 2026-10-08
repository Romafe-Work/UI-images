/* =========================================================
   PICK — o início de sessão da app do armazém, na versão compacta
   Só o cartão: sem fotografia, sem texto de apresentação, sem tema nem
   idioma, sem apoio, sem rodapé e sem «manter sessão» (o aparelho é de todos).
   ========================================================= */
import type { OpcoesEntrar } from '../../comum/entrar/entrar';

export const entrarMobile: OpcoesEntrar = {
  variante: 'compacta',
  comRomafe: true,
  fixo: true,
  marca: { nome: 'ROMAFE', sub: 'Pick' },
  produto: 'Romafe',
};

/** v2, sem a Romafe. A app do armazém chama-se Pick (ela, 8 out. 2026):
    o nome e o subtítulo mudam-se aqui. */
export const entrarMobileNeutro: OpcoesEntrar = {
  variante: 'compacta',
  comRomafe: true,
  fixo: true,
  marca: { nome: 'Pick', sub: 'Armazém' },
  produto: 'Pick',
  semRomafe: true,
};

/** v4, a família Romafe (8 out. 2026): aplicação interna. O ROMAFE em
    Motor por cima e o nome da app, Pick, como nas outras apps da família.
    Sem a palavra «Mobile» (ela tirou-a no mesmo dia). */
export const entrarMobileFamilia: OpcoesEntrar = {
  variante: 'compacta',
  comRomafe: true,
  fixo: true,
  familia: 'interna',
  marca: { nome: 'ROMAFE', sub: 'Armazém' },
  produto: 'Pick',
};
