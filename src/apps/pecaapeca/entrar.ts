/* =========================================================
   PEÇA A PEÇA — o que o início de sessão tem de próprio na Peça a Peça
   A loja online (WebShop) da Romafe; até 8 out. 2026 chamava-se GoShop.
   Completo, como o do ERP. A linha por baixo do nome, a apresentação e o
   convite são propostas, por confirmar: o que estava aqui era de gestão
   de oficina, e uma loja online vende peças.
   ========================================================= */
import type { OpcoesEntrar } from '../../comum/entrar/entrar';

export const entrarPecaAPeca: OpcoesEntrar = {
  variante: 'completa',
  familia: 'webshop',
  marca: { nome: 'PEÇA A PEÇA', sub: 'A loja online de peças' },
  produto: 'Peça a Peça',
  convite: { texto: 'Ainda não é cliente?', ligacao: 'Pedir conta' },
  apresentacao: {
    titulo: 'A peça certa,<br>entregue<br>na sua oficina',
    vantagens: [
      { icone: 'procura', titulo: 'Procura pela matrícula', sub: 'Ou pela referência, pela marca e pelo modelo' },
      { icone: 'relogio', titulo: 'Os seus preços e o stock', sub: 'O que há em armazém, agora' },
      { icone: 'camiao', titulo: 'Encomendas e entregas', sub: 'Cada encomenda acompanhada até à porta' },
    ],
  },
};
