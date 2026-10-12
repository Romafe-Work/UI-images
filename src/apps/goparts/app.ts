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
  /* 12 out. 2026: ela pediu só uma versão nos quatro ecrãs de entrar — a «Família Romafe»
     com o cartão ao centro (a v5; no 04 é a v4), a que combina com o Início v2.2 */
  ecras: [...ecrasEntrar(versoesRomafe(entrarGoParts, 'GoParts')).map((e) => ({
    ...e,
    versoes: [e.versoes.find((v) => v.nota.startsWith('Família Romafe com o cartão ao centro')) ?? e.versoes[0]] as typeof e.versoes,
  })), ...ecrasPortal, ...ecrasCarregar(GOPARTS), ...ecrasErro()],
};
