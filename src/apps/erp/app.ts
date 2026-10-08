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
  ecras: [...ecrasEntrar([
    ...versoesCompletas(entrarErp),
    { id: 'v8', nota: 'Pouco texto à volta: a fotografia clara em diagonal com o ROMAFE azul, e o cartão só com o ROMAFE, o ERP e o campo', opcoes: { ...entrarErp, familia: undefined, minimo: { selo: 'ERP' } } },
  ])],
};
