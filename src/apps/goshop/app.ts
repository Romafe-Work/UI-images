import type { App } from '../../comum/tipos';
import { ecrasEntrar, versoesRomafe, DESCRICAO_ENTRAR } from '../../comum/entrar/entrar';
import type { IdGoShop } from './ids';
import { entrarGoShop } from './entrar';

export const goshop: App<IdGoShop> = {
  id: 'goshop',
  nome: 'GoShop',
  sub: 'A loja online de peças',
  grupo: 'WebShop',
  marca: 'GOSHOP',
  tela: { l: 1440, a: 900 },
  fluxos: { 'Entrar': DESCRICAO_ENTRAR },
  ecras: [...ecrasEntrar(versoesRomafe(entrarGoShop, 'GoShop'))],
};
