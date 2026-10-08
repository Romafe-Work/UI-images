import type { App } from '../../comum/tipos';
import { ecrasEntrar, versoesRomafe, DESCRICAO_ENTRAR } from '../../comum/entrar/entrar';
import type { IdPartPicker } from './ids';
import { entrarPartPicker } from './entrar';

export const partpicker: App<IdPartPicker> = {
  id: 'partpicker',
  nome: 'Part Picker',
  sub: 'O marketplace de peças auto',
  grupo: 'MarketPlace',
  marca: 'PART PICKER',
  tela: { l: 1440, a: 900 },
  fluxos: { 'Entrar': DESCRICAO_ENTRAR },
  ecras: [...ecrasEntrar(versoesRomafe(entrarPartPicker, 'Part Picker'))],
};
