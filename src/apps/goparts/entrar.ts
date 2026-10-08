/* =========================================================
   GOPARTS — o que o início de sessão tem de próprio no GoParts
   O marketplace da Romafe. A 8 out. 2026 chamou-se Part Picker por umas horas; ela voltou a GoParts.
   Completo, como o do ERP. A linha por baixo do nome, a apresentação e o
   convite são propostas, por confirmar: num marketplace vendem muitos, e
   quem entra tanto pode comprar como vender.
   ========================================================= */
import type { OpcoesEntrar } from '../../comum/entrar/entrar';

export const entrarGoParts: OpcoesEntrar = {
  variante: 'completa',
  familia: 'marketplace',
  /* como no ERP: o ROMAFE sempre azul e o cartão sempre no mesmo sítio */
  comRomafe: true,
  fixo: true,
  marca: { nome: 'GOPARTS', sub: 'O marketplace de peças auto' },
  produto: 'GoParts',
  convite: { texto: 'Quer vender peças?', ligacao: 'Abrir loja no GoParts' },
  apresentacao: {
    titulo: 'Muitos vendedores,<br>uma só encomenda',
    vantagens: [
      { icone: 'procura', titulo: 'Compare vendedores', sub: 'Preço, prazo e avaliação lado a lado' },
      { icone: 'caixa', titulo: 'Um só carrinho', sub: 'Peças de vários vendedores na mesma encomenda' },
      { icone: 'empresa', titulo: 'Venda também', sub: 'Abra a sua loja e chegue a mais oficinas' },
    ],
  },
};
