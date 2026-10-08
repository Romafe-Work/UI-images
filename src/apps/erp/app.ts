import type { App } from '../../comum/tipos';
import { ecrasEntrar, versoesCompletas, DESCRICAO_ENTRAR, type VersaoEntrar } from '../../comum/entrar/entrar';
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
    /* a v6 saiu a 8 out. 2026, a pedido dela; as outras guardam o número */
    ...versoesCompletas(entrarErp).filter((v) => v.id !== 'v6') as [VersaoEntrar, ...VersaoEntrar[]],
    { id: 'v8', nota: 'Pouco texto à volta: a fotografia sem texto com faixas azuis em diagonal, e o cartão com o ROMAFE, o ERP, o campo e a ajuda', opcoes: { ...entrarErp, familia: undefined, minimo: { selo: 'ERP' } } },
    { id: 'v9', nota: 'A fotografia no ecrã todo, com formas azuis nos cantos, e o cartão da v8 ao centro', opcoes: { ...entrarErp, familia: undefined, minimo: { selo: 'ERP', centro: true } } },
  ])],
};
