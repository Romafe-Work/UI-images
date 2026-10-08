import type { App } from '../../comum/tipos';
import { ecrasEntrar, versoesCompletas, DESCRICAO_ENTRAR } from '../../comum/entrar/entrar';
import type { IdErp } from './ids';
import { entrarErp } from './entrar';

export const erp: App<IdErp> = {
  id: 'erp',
  nome: 'ERP',
  sub: 'A plataforma de gestão',
  grupo: 'ERP',
  marca: 'ROMAFE',
  tela: { l: 1440, a: 900 },
  fluxos: { 'Entrar': DESCRICAO_ENTRAR },
  ecras: [...ecrasEntrar(versoesCompletas(entrarErp))],
};
