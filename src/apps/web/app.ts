import type { App } from '../../comum/tipos';
import { ecrasEntrar } from '../../comum/entrar/entrar';
import type { IdWeb } from './ids';
import { entrarGoShop, entrarGoParts } from './entrar';

export const web: App<IdWeb> = {
  id: 'web',
  nome: 'Web',
  sub: 'GoShop e GoParts, no navegador',
  marca: 'WEB',
  tela: { l: 1440, a: 900 },
  fluxos: {
    'Entrar no GoShop': 'O início de sessão comum, com a marca do GoShop. Primeiro o endereço, e o domínio decide o caminho.',
    'Entrar no GoParts': 'O início de sessão comum, com a marca do GoParts. Primeiro o endereço, e o domínio decide o caminho.',
  },
  ecras: [
    ...ecrasEntrar(entrarGoShop, 'goshop-'),
    ...ecrasEntrar(entrarGoParts, 'goparts-'),
  ],
};
