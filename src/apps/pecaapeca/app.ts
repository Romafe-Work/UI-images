import type { App } from '../../comum/tipos';
import { ecrasEntrar, versoesRomafe, DESCRICAO_ENTRAR } from '../../comum/entrar/entrar';
import type { IdPecaAPeca } from './ids';
import { entrarPecaAPeca } from './entrar';

export const pecaapeca: App<IdPecaAPeca> = {
  id: 'pecaapeca',
  nome: 'Peça a Peça',
  sub: 'A loja online de peças',
  grupo: 'WebShop',
  marca: 'PEÇA A PEÇA',
  tela: { l: 1440, a: 900 },
  fluxos: { 'Entrar': DESCRICAO_ENTRAR },
  ecras: [...ecrasEntrar(versoesRomafe(entrarPecaAPeca, 'Peça a Peça'))],
};
