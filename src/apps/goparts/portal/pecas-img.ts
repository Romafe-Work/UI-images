/* =========================================================
   GOPARTS — as imagens das peças nas linhas de artigos (15 out. 2026)
   Ela: «preciso de mais imagens em todos os screens». Não há fotografias licenciadas das peças (e os briefings dela
   dizem para não as inventar), por isso cada linha de artigo leva o DESENHO da peça, no traço dos ícones das
   categorias do Início (categorias-svg.ts: 24 × 24, 2 px, pontas redondas), escolhido pela descrição do artigo:
   disco, pastilhas, filtro, amortecedor, rolamento, correia, bomba de água, lâmpada, escova, óleo, embraiagem,
   vela, sensor, junta… O que não se reconhece fica com a caixa de peça. O desenho mexe ao passar o rato pela linha
   (o gesto das categorias: o disco trava, a mola comprime, a luz acende…), uma vez por passagem.
   Quando houver fotografias licenciadas (por referência), entram aqui no lugar do desenho.
   ========================================================= */
import { CAT_SVG } from './categorias-svg';

const svg = (k: string, corpo: string) => `<svg class="ca ca--${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${corpo}</svg>`;
/* os desenhos que as categorias não têm */
const PROPRIOS: Record<string, string> = {
  rolamento: svg('rolamento', '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><g class="ca-esferas"><circle cx="12" cy="5.8" r="1.2"/><circle cx="17.4" cy="9" r="1.2"/><circle cx="17.4" cy="15" r="1.2"/><circle cx="12" cy="18.2" r="1.2"/><circle cx="6.6" cy="15" r="1.2"/><circle cx="6.6" cy="9" r="1.2"/></g>'),
  pastilhas: svg('pastilhas', '<path d="M4 6h7v12H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/><path class="ca-pastilha" d="M20 6h-7v12h7a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z"/><path d="M6 9v6M18 9v6"/>'),
  escova: svg('escova', '<path class="ca-braco" d="M4 20 20 6"/><path d="M6 21l-3-3M21 5l-2-2"/><path d="M9 14l2 2M13 10.5l2 2"/>'),
  vela: svg('vela', '<path d="M10 2h4v4h-4z"/><path d="M8 6h8v4H8z"/><path d="M10 10h4v7h-4z"/><path class="ca-faisca" d="M12 17v3M10 22l2-2 2 2"/>'),
  junta: svg('junta', '<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="6.5" cy="8.5" r="1"/><circle cx="17.5" cy="8.5" r="1"/><circle cx="6.5" cy="15.5" r="1"/><circle cx="17.5" cy="15.5" r="1"/>'),
  bomba: svg('bomba', '<circle cx="11" cy="13" r="6"/><g class="ca-turbina"><path d="M11 9v8M7 13h8"/></g><path d="M17 13h4M3 13h2M11 4v3"/>'),
  pecas: svg('pecas', '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.7 4.7a2 2 0 0 0 2 0L20.7 7"/>'),
};
/** Pela descrição do artigo: [palavras, desenho]. A primeira que encaixa ganha (a ordem importa: «kit de rolamento»
    é rolamento; «kit de distribuição com bomba de água» é a correia; «líquido de travões» é óleo, não travagem). */
const REGRAS: [RegExp, () => string][] = [
  [/rolamento/i, () => PROPRIOS.rolamento],
  [/pastilha/i, () => PROPRIOS.pastilhas],
  [/disco/i, () => CAT_SVG.Travagem],
  [/amortecedor|mola/i, () => CAT_SVG['Suspensão']],
  [/filtro/i, () => CAT_SVG.Filtros],
  [/correia|distribuição|tensor/i, () => CAT_SVG.Correias],
  [/bomba de [aá]gua|termóstato|refrigera/i, () => PROPRIOS.bomba],
  [/l[aâ]mpada|farol/i, () => CAT_SVG['Iluminação']],
  [/escova/i, () => PROPRIOS.escova],
  [/[óo]leo|l[íi]quido/i, () => CAT_SVG['Óleo motor']],
  [/embraiagem|cilindro recetor|volante/i, () => CAT_SVG.Embraiagem],
  [/vela|cabo de vela/i, () => PROPRIOS.vela],
  [/sensor|fus[íi]ve|bateria/i, () => CAT_SVG.Bateria],
  [/junta|retentor|abraçadeira|parafuso/i, () => PROPRIOS.junta],
];
/** O desenho da peça desta descrição (ou a caixa de peça). */
export function imagemPeca(descricao: string): string {
  const r = REGRAS.find(([re]) => re.test(descricao));
  return r ? r[1]() : PROPRIOS.pecas;
}
/** O azulejo com o desenho, para pôr à esquerda de uma linha de artigo. */
export const azulejoPeca = (descricao: string, cls = '') => `<span class="pc-img${cls ? ` ${cls}` : ''}" aria-hidden="true">${imagemPeca(descricao)}</span>`;
