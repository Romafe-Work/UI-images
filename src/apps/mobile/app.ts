import type { App } from '../../comum/tipos';
import { ecrasEntrar, DESCRICAO_ENTRAR } from '../../comum/entrar/entrar';
import type { IdMobile } from './ids';
import { entrarMobile, entrarMobileNeutro } from './entrar';

export const mobile: App<IdMobile> = {
  id: 'mobile',
  nome: 'Mobile',
  sub: 'Para o telemóvel e o PDA',
  grupo: 'Mobile',
  marca: 'MOBILE',
  tela: { l: 480, a: 800 },
  fluxos: { 'Entrar': DESCRICAO_ENTRAR },
  ecras: [...ecrasEntrar([
    { id: 'v1', nota: 'Compacta: só o cartão, sobre a fotografia', opcoes: entrarMobile },
    /* como a v4 das outras apps: o produto pode ser de outra empresa */
    { id: 'v2', nota: 'A v1 sem nada da Romafe: nem o nome, nem o desenho do logótipo, nem a fotografia do armazém', opcoes: entrarMobileNeutro },
    { id: 'v3', nota: 'A v2 com marca e fundo: o monograma do produto e um desenho abstrato', opcoes: { ...entrarMobileNeutro, desenhado: true } },
  ])],
};
