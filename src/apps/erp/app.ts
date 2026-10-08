import type { App } from '../../comum/tipos';
import { ecrasEntrar, versoesCompletas, DESCRICAO_ENTRAR, type VersaoEntrar } from '../../comum/entrar/entrar';
import type { IdErp } from './ids';
import { entrarErp } from './entrar';

/** As versões numeram-se pela ordem, sem buracos: quando uma sai, as de
    depois sobem um número (ela, 8 out. 2026: «muda só o nome da versão»). */
function numerar(vs: VersaoEntrar[]): [VersaoEntrar, ...VersaoEntrar[]] {
  return vs.map((v, i) => ({ ...v, id: 'v' + (i + 1) })) as [VersaoEntrar, ...VersaoEntrar[]];
}

export const erp: App<IdErp> = {
  id: 'erp',
  nome: 'ERP',
  sub: 'A plataforma de gestão',
  grupo: 'ERP',
  marca: 'ROMAFE',
  tela: { l: 1440, a: 900 },
  fluxos: { 'Entrar': DESCRICAO_ENTRAR },
  ecras: [...ecrasEntrar(numerar([
    /* a v5 e a v6 de antes saíram a 8 out. 2026, a pedido dela */
    ...versoesCompletas(entrarErp).filter((v) => v.id !== 'v5' && v.id !== 'v6'),
    { id: '', nota: 'Pouco texto à volta: a fotografia sem texto com faixas azuis em diagonal, e o cartão com o ROMAFE, o ERP, o campo e a ajuda', opcoes: { ...entrarErp, familia: undefined, minimo: { selo: 'ERP' } } },
    { id: '', nota: 'A fotografia no ecrã todo, com formas azuis nos cantos, e o cartão da anterior ao centro', opcoes: { ...entrarErp, familia: undefined, minimo: { selo: 'ERP', centro: true } } },
  ]))],
};
