import type { App } from '../../comum/tipos';
import { ecrasEntrar, DESCRICAO_ENTRAR } from '../../comum/entrar/entrar';
import type { IdErp } from './ids';
import { entrarErp } from './entrar';

export const erp: App<IdErp> = {
  id: 'erp',
  nome: 'ERP',
  sub: 'Rolgest, a plataforma de gestão',
  grupo: 'ERP',
  marca: 'ROLGEST',
  tela: { l: 1440, a: 900 },
  fluxos: { 'Entrar': DESCRICAO_ENTRAR },
  ecras: [...ecrasEntrar(entrarErp)],
};
