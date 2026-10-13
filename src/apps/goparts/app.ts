import type { App } from '../../comum/tipos';
import { ecrasCarregar, DESCRICAO_CARREGAR } from '../../comum/carregar/carregar';
import { GOPARTS } from './portal/base';
import { DESCRICAO_ENTRAR } from '../../comum/entrar/entrar';
import type { IdGoParts } from './ids';
import { ecrasEntrar22 } from './entrar-v22';
import { ecraAbertura } from './abertura';
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
  /* 12 out. 2026: os quatro ecrãs de entrar são os do estilo do Início v2.2, com a
     fotografia da oficina (entrar-v22.ts); a «Família Romafe» saiu (ela não gostou) */
  /* 13 out. 2026: a abertura animada antes do login (abertura.ts) */
  ecras: [ecraAbertura(), ...ecrasEntrar22(), ...ecrasPortal, ...ecrasCarregar(GOPARTS), ...ecrasErro()],
};
