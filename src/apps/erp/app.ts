import type { App } from '../../comum/tipos';
import { ecrasEntrar, versoesRomafe, DESCRICAO_ENTRAR } from '../../comum/entrar/entrar';
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
    ...versoesRomafe(entrarErp, 'ERP'),
    /* a de teste, sem nada que pareça gerado: a fotografia verdadeira e o painel liso */
    { id: 'v8', nota: 'Teste: a fotografia verdadeira do armazém, nítida e sem efeitos, e um painel branco liso com o ROMAFE grande', opcoes: { ...entrarErp, familia: undefined, minimo: { selo: 'ERP', foto: 'corredor' } } },
    { id: 'v9', nota: 'A v8 mais viva: três fotografias da Romafe em mosaico (a separação, o corredor, a sede) e os números da casa', opcoes: { ...entrarErp, familia: undefined, minimo: { selo: 'ERP', foto: 'mosaico' } } },
  ])],
};
