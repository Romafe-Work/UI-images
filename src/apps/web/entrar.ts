/* =========================================================
   WEB — dois produtos, GoShop e GoParts, cada um com o seu início de sessão
   Completos, como o do ERP, e com o mesmo texto de apresentação: só muda
   o nome do produto. As linhas por baixo da marca são provisórias.
   ========================================================= */
import type { OpcoesEntrar } from '../../comum/entrar/entrar';

export const entrarGoShop: OpcoesEntrar = {
  variante: 'completa',
  marca: { nome: 'GOSHOP', sub: 'Gestão de oficina' },
  produto: 'GoShop',
  fluxo: 'Entrar no GoShop',
};

export const entrarGoParts: OpcoesEntrar = {
  variante: 'completa',
  marca: { nome: 'GOPARTS', sub: 'Peças para um mundo em movimento' },
  produto: 'GoParts',
  fluxo: 'Entrar no GoParts',
};
