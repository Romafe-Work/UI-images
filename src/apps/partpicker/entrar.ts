/* =========================================================
   PART PICKER — o que o início de sessão tem de próprio no Part Picker
   O marketplace da Romafe; até 8 out. 2026 chamava-se GoParts.
   Completo, como o do ERP. A linha por baixo do nome, a apresentação e o
   convite são propostas, por confirmar: num marketplace vendem muitos, e
   quem entra tanto pode comprar como vender.
   ========================================================= */
import type { OpcoesEntrar } from '../../comum/entrar/entrar';

export const entrarPartPicker: OpcoesEntrar = {
  variante: 'completa',
  familia: 'marketplace',
  /* como no ERP: o ROMAFE sempre azul e o cartão sempre no mesmo sítio */
  comRomafe: true,
  fixo: true,
  marca: { nome: 'PART PICKER', sub: 'O marketplace de peças auto' },
  produto: 'Part Picker',
  convite: { texto: 'Quer vender peças?', ligacao: 'Abrir loja no Part Picker' },
  apresentacao: {
    titulo: 'Muitos vendedores,<br>uma só encomenda',
    vantagens: [
      { icone: 'procura', titulo: 'Compare vendedores', sub: 'Preço, prazo e avaliação lado a lado' },
      { icone: 'caixa', titulo: 'Um só carrinho', sub: 'Peças de vários vendedores na mesma encomenda' },
      { icone: 'empresa', titulo: 'Venda também', sub: 'Abra a sua loja e chegue a mais oficinas' },
    ],
  },
};
