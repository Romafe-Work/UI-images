import type { App } from '../../comum/tipos';
import { ecrasEntrar, DESCRICAO_ENTRAR } from '../../comum/entrar/entrar';
import type { IdMobile } from './ids';
import { entrarMobile, entrarMobileNeutro, entrarMobileFamilia } from './entrar';

export const mobile: App<IdMobile> = {
  id: 'mobile',
  nome: 'Pick',
  sub: 'A app do armazém, no PDA',
  grupo: 'Pick',
  marca: 'PICK',
  /* o ecrã do Honeywell EDA61K: 4", 480 × 800 píxeis físicos a densidade
     1,5 (hdpi), o que dá 320 × 533 píxeis CSS (dp) */
  tela: { l: 320, a: 533 },
  fluxos: { 'Entrar': DESCRICAO_ENTRAR },
  ecras: [...ecrasEntrar([
    { id: 'v1', nota: 'Compacta: só o cartão, sobre a fotografia', opcoes: entrarMobile },
    /* como a v4 das outras apps: o produto pode ser de outra empresa */
    { id: 'v2', nota: 'A v1 sem nada da Romafe: nem o nome, nem o desenho do logótipo, nem a fotografia do armazém', opcoes: entrarMobileNeutro },
    { id: 'v3', nota: 'A v2 com marca e fundo: o monograma do produto e um desenho abstrato', opcoes: { ...entrarMobileNeutro, desenhado: true } },
    { id: 'v4', nota: 'Família Romafe, aplicações internas: o ROMAFE em Motor e o nome Pick no cartão, sobre a fotografia do armazém', opcoes: entrarMobileFamilia },
  ])],
};
