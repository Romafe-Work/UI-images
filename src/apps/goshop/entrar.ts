/* =========================================================
   GOSHOP — o que o início de sessão tem de próprio no GoShop
   A loja online (WebShop) da Romafe. A 8 out. 2026 chamou-se Peça a Peça por umas horas; ela voltou a GoShop.
   Completo, como o do ERP. A linha por baixo do nome, a apresentação e o
   convite são propostas, por confirmar: o que estava aqui era de gestão
   de oficina, e uma loja online vende peças.
   ========================================================= */
import type { OpcoesEntrar } from '../../comum/entrar/entrar';

export const entrarGoShop: OpcoesEntrar = {
  variante: 'completa',
  familia: 'webshop',
  /* como no ERP: o ROMAFE sempre azul e o cartão sempre no mesmo sítio */
  comRomafe: true,
  fixo: true,
  marca: { nome: 'GOSHOP', sub: 'A loja online de peças' },
  produto: 'GoShop',
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
