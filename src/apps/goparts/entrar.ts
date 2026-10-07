/* =========================================================
   GOPARTS — o que o início de sessão tem de próprio no GoParts
   Completo, como o do ERP. A apresentação segue os ecrãs do portal que já
   existem no Figma-WebShop-GoParts: catálogo, pedidos e guias de remessa.
   ========================================================= */
import type { OpcoesEntrar } from '../../comum/entrar/entrar';

export const entrarGoParts: OpcoesEntrar = {
  variante: 'completa',
  marca: { nome: 'GOPARTS', sub: 'Peças para um mundo em movimento' },
  produto: 'GoParts',
  apresentacao: {
    titulo: 'As peças certas<br>à primeira',
    vantagens: [
      { icone: 'procura', titulo: 'Catálogo por viatura', sub: 'Pela matrícula, pela referência ou pelo modelo' },
      { icone: 'relogio', titulo: 'Os seus preços e o stock', sub: 'O que há em armazém, agora' },
      { icone: 'camiao', titulo: 'Pedidos e guias de remessa', sub: 'O histórico de tudo o que encomendou' },
    ],
  },
};
