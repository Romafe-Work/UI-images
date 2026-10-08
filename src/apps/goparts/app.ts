import type { App } from '../../comum/tipos';
import { ecrasCarregar, DESCRICAO_CARREGAR } from '../../comum/carregar/carregar';
import { GOPARTS } from './portal/base';
import { ecrasEntrar, versoesRomafe, DESCRICAO_ENTRAR } from '../../comum/entrar/entrar';
import type { IdGoParts } from './ids';
import { entrarGoParts } from './entrar';
import { ecrasPortal } from './portal/ecras';
import { ecrasErro, DESCRICAO_ERROS } from './erros/erros';

export const goparts: App<IdGoParts> = {
  id: 'goparts',
  nome: 'GoParts',
  sub: 'O marketplace de peças auto',
  grupo: 'MarketPlace',
  marca: 'GOPARTS',
  tela: { l: 1440, a: 900 },
  fluxos: {
    'Entrar': DESCRICAO_ENTRAR,
    'Portal': 'Depois de entrar: o Início com as três pesquisas, o catálogo, os pedidos e as guias de remessa.',
    'Carregamento': DESCRICAO_CARREGAR,
    'Erros': DESCRICAO_ERROS,
  },
  ecras: [...ecrasEntrar(versoesRomafe(entrarGoParts, 'GoParts')), ...ecrasPortal, ...ecrasCarregar(GOPARTS), ...ecrasErro()],
};
