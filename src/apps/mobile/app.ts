import type { App } from '../../comum/tipos';
import { ecrasEntrar, DESCRICAO_ENTRAR } from '../../comum/entrar/entrar';
import type { IdMobile } from './ids';
import { entrarMobile } from './entrar';

export const mobile: App<IdMobile> = {
  id: 'mobile',
  nome: 'Mobile',
  sub: 'Para o telemóvel e o PDA',
  grupo: 'Mobile',
  marca: 'MOBILE',
  tela: { l: 480, a: 800 },
  fluxos: { 'Entrar': DESCRICAO_ENTRAR },
  ecras: [...ecrasEntrar([{ id: 'v1', nota: 'Compacta: só o cartão, sobre a fotografia', opcoes: entrarMobile }])],
};
