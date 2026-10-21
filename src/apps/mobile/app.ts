import type { App } from '../../comum/tipos';
import { ecrasEntrar, DESCRICAO_ENTRAR } from '../../comum/entrar/entrar';
import type { IdMobile } from './ids';
import { entrarMobile, entrarMobileNeutro, entrarMobileFamilia } from './entrar';
import { ecrasCarregarPick, ecrasErroPick, DESCRICAO_CARREGAR_PICK, DESCRICAO_ERROS_PICK } from './estados';
import { ecrasInventario, DESCRICAO_INVENTARIO } from './inventario';
import { entrarIndustrial, ESTADOS_ENTRAR_PK } from './entrar-industrial';
import type { Ecra } from '../../comum/tipos';

export const mobile: App<IdMobile> = {
  id: 'mobile',
  nome: 'Pick',
  sub: 'A app do armazém, no PDA',
  grupo: 'Pick',
  marca: 'PICK',
  /* o ecrã do Honeywell EDA61K: 4", 480 × 800 píxeis físicos a densidade
     1,5 (hdpi), o que dá 320 × 533 píxeis CSS (dp) */
  tela: { l: 320, a: 533 },
  fluxos: { 'Entrar': DESCRICAO_ENTRAR, 'Inventário': DESCRICAO_INVENTARIO, 'Carregamento': DESCRICAO_CARREGAR_PICK, 'Erros': DESCRICAO_ERROS_PICK },
  ecras: [...comEntradaIndustrial(ecrasEntrar([
    { id: 'v1', nota: 'Compacta: só o cartão, sobre a fotografia', opcoes: entrarMobile },
    /* como a v4 das outras apps: o produto pode ser de outra empresa */
    { id: 'v2', nota: 'A v1 sem nada da Romafe: nem o nome, nem o desenho do logótipo, nem a fotografia do armazém', opcoes: entrarMobileNeutro },
    { id: 'v3', nota: 'A v2 com fundo desenhado e, por cima do nome, o ROMAFE em Motor (era o monograma P)', opcoes: { ...entrarMobileNeutro, desenhado: true, monogramaRomafe: true } },
    { id: 'v4', nota: 'Família Romafe, aplicações internas: o ROMAFE em Motor e o nome Pick no cartão, sobre a fotografia do armazém', opcoes: entrarMobileFamilia },
  ])), ...ecrasInventario(), ...ecrasCarregarPick(), ...ecrasErroPick()],
};

/* (21 out. 2026) a entrada industrial: uma v5 só no 01 · Entrar (o utilizador e a palavra-passe no mesmo ecrã) e os
   seus estados logo a seguir; as v1–v4 ficam como estavam */
function comEntradaIndustrial(ecras: Ecra<IdMobile>[]): Ecra<IdMobile>[] {
  const r: Ecra<IdMobile>[] = [];
  ecras.forEach((e) => {
    if (e.id !== 'entrada') { r.push(e); return; }
    r.push({ ...e, versoes: [...e.versoes, { id: 'v5', nota: 'A entrada industrial (21 out.): a linha de estado (rede e servidor em separado), o ROMAFE e «Pick · Operações de armazém», o código de barras que se arruma numa estante, e o utilizador e a palavra-passe no mesmo ecrã', html: entrarIndustrial() }] });
    ESTADOS_ENTRAR_PK.forEach(([est, id, nome, objetivo]) => r.push({ id: id as IdMobile, nome, fluxo: e.fluxo, objetivo, estadoDe: 'entrada', versoes: [{ id: 'v5', nota: 'A entrada industrial (21 out.)', html: entrarIndustrial(est) }] }));
  });
  return r;
}
