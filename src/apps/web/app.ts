import type { App } from '../../comum/tipos';
import { ecrasEntrar, DESCRICAO_ENTRAR } from '../../comum/entrar/entrar';
import type { IdWeb } from './ids';
import { entrarWeb } from './entrar';

export const web: App<IdWeb> = {
  id: 'web',
  nome: 'Web',
  sub: 'Para abrir no navegador',
  marca: 'WEB',
  tela: { l: 1440, a: 900 },
  fluxos: { 'Entrar': DESCRICAO_ENTRAR },
  ecras: [...ecrasEntrar(entrarWeb)],
};
