/* =========================================================
   GOSHOP — o que o início de sessão tem de próprio no GoShop
   Completo, como o do ERP. A linha por baixo da marca e a apresentação
   são propostas, por confirmar.
   ========================================================= */
import type { OpcoesEntrar } from '../../comum/entrar/entrar';

export const entrarGoShop: OpcoesEntrar = {
  variante: 'completa',
  marca: { nome: 'GOSHOP', sub: 'Gestão de oficina' },
  produto: 'GoShop',
  apresentacao: {
    titulo: 'A oficina<br>do orçamento<br>à entrega',
    vantagens: [
      { icone: 'ferramenta', titulo: 'Ordens de reparação', sub: 'Do orçamento à fatura, sem papel' },
      { icone: 'carro', titulo: 'Clientes e viaturas', sub: 'O histórico de cada matrícula num só sítio' },
      { icone: 'caixa', titulo: 'Peças da Romafe', sub: 'Encomendadas a partir da própria reparação' },
    ],
  },
};

/** Na v4 não há Romafe à vista: as peças são «do fornecedor». */
export const entrarGoShopV4: Partial<OpcoesEntrar> = {
  apresentacao: {
    ...entrarGoShop.apresentacao!,
    vantagens: [
      entrarGoShop.apresentacao!.vantagens[0],
      entrarGoShop.apresentacao!.vantagens[1],
      { icone: 'caixa', titulo: 'Peças do fornecedor', sub: 'Encomendadas a partir da própria reparação' },
    ],
  },
};
