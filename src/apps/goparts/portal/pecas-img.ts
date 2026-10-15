/* =========================================================
   GOPARTS — as imagens das peças nas linhas de artigos (15 out. 2026)
   Ela: «preciso de mais imagens em todos os screens» e, depois, «as imagens refiro-me a imagens dos produtos aqui
   [nas linhas de artigos]». Não há fotografias dos produtos neste protótipo (e o repositório é público: não se usam
   as dos fabricantes, nem se inventa a fotografia de um produto concreto). Cada linha leva então a IMAGEM DO TIPO DE
   PEÇA, desenhada como uma fotografia de loja: a peça a cores, com volume (dois ou três tons lisos, sem gradientes),
   num fundo claro. Escolhe-se pela descrição do artigo; o que não se reconhece fica com a caixa de cartão.
   Quando a Romafe tiver as fotografias (o fornecedor do catálogo costuma tê-las, por referência), entram em FOTOS e
   ganham ao desenho.
   ========================================================= */

/** As fotografias verdadeiras, por referência (vazio neste protótipo). */
export const FOTOS: Record<string, string> = {};

const s = (k: string, corpo: string) => `<svg class="pf pf--${k}" viewBox="0 0 64 64" aria-hidden="true">${corpo}</svg>`;
/* tons: aço (claro, médio, escuro), borracha, papel, plástico */
const A1 = '#d3d7dc', A2 = '#a9afb7', A3 = '#7b828b', BOR = '#2b2e33';

const DESENHOS: Record<string, string> = {
  disco: s('disco', `<circle cx="32" cy="32" r="27" fill="${A2}" stroke="${A3}" stroke-width="1.5"/><circle cx="32" cy="32" r="20" fill="${A1}"/>
    <g stroke="${A3}" stroke-width="1.4" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M32 9.5v4" transform="rotate(${a} 32 32)"/>`).join('')}</g>
    <circle cx="32" cy="32" r="12" fill="${A3}"/><circle cx="32" cy="32" r="4.5" fill="#eef0f3"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="32" cy="24.5" r="1.7" fill="#eef0f3" transform="rotate(${a} 32 32)"/>`).join('')}`),
  pastilhas: s('pastilhas', `<path d="M8 22q0-6 6-6h14l4 4v24q0 4-4 4H14q-6 0-6-6z" fill="${A2}" stroke="${A3}" stroke-width="1.2"/><path d="M11 24q0-4 4-4h12v22H15q-4 0-4-4z" fill="${BOR}"/>
    <path d="M56 22q0-6-6-6H36l-4 4v24q0 4 4 4h14q6 0 6-6z" fill="${A2}" stroke="${A3}" stroke-width="1.2"/><path d="M53 24q0-4-4-4H37v22h12q4 0 4-4z" fill="${BOR}"/><path d="M19 20v22M45 20v22" stroke="#45494f" stroke-width="1"/>`),
  'filtro-oleo': s('filtro-oleo', `<rect x="17" y="14" width="30" height="38" rx="4" fill="#2f63a6"/><rect x="17" y="14" width="30" height="7" rx="3" fill="#24518a"/>
    <path d="M21 46h22" stroke="#24518a" stroke-width="3"/><rect x="22" y="27" width="20" height="11" rx="1.5" fill="#f3f4f6"/><path d="M25 31h14M25 34h9" stroke="#2f63a6" stroke-width="1.4"/><ellipse cx="32" cy="12.5" rx="10" ry="2.5" fill="${BOR}"/>`),
  'filtro-ar': s('filtro-ar', `<path d="M8 20l14-8h34l-14 8z" fill="#3b3f45"/><rect x="8" y="20" width="34" height="32" rx="1.5" fill="#3b3f45"/><path d="M42 20l14-8v32l-14 8z" fill="#2b2e33"/>
    <rect x="11" y="23" width="28" height="26" fill="#efe7d3"/><g stroke="#cbbf9f" stroke-width="1.2">${[14, 17, 20, 23, 26, 29, 32, 35].map((x) => `<path d="M${x} 23v26"/>`).join('')}</g>`),
  'filtro-habitaculo': s('filtro-habitaculo', `<path d="M8 22l12-7h36l-12 7z" fill="#d9dde2"/><rect x="8" y="22" width="36" height="28" rx="1.5" fill="#cfd4da"/><path d="M44 22l12-7v28l-12 7z" fill="#b9bfc7"/>
    <rect x="11" y="25" width="30" height="22" fill="#5a6068"/><g stroke="#3f444b" stroke-width="1.2">${[14, 17, 20, 23, 26, 29, 32, 35, 38].map((x) => `<path d="M${x} 25v22"/>`).join('')}</g>`),
  amortecedor: s('amortecedor', `<g transform="rotate(-35 32 32)"><rect x="27" y="2" width="10" height="7" rx="3.5" fill="none" stroke="${A3}" stroke-width="2.5"/><rect x="30.5" y="9" width="3" height="18" fill="${A1}" stroke="${A2}" stroke-width=".8"/>
    <rect x="25" y="26" width="14" height="30" rx="2" fill="#30343a"/><rect x="25" y="26" width="14" height="4" fill="#45494f"/><rect x="25" y="44" width="14" height="2.5" fill="#d6a400"/><rect x="27" y="56" width="10" height="7" rx="3.5" fill="none" stroke="${A3}" stroke-width="2.5"/></g>`),
  rolamento: s('rolamento', `<circle cx="32" cy="32" r="25" fill="${A2}" stroke="${A3}" stroke-width="1.5"/><circle cx="32" cy="32" r="19.5" fill="#4a4f56"/>
    ${Array.from({ length: 10 }, (_, i) => `<circle cx="32" cy="15.8" r="3.3" fill="${A1}" stroke="${A3}" stroke-width=".8" transform="rotate(${i * 36} 32 32)"/>`).join('')}
    <circle cx="32" cy="32" r="12.5" fill="${A2}" stroke="${A3}" stroke-width="1.2"/><circle cx="32" cy="32" r="7.5" fill="#eef0f3"/>`),
  correia: s('correia', `<path d="M16 14h32a12 12 0 0 1 0 36H16a12 12 0 0 1 0-36z" fill="none" stroke="${BOR}" stroke-width="7"/><path d="M16 14h32a12 12 0 0 1 0 36H16a12 12 0 0 1 0-36z" fill="none" stroke="#4a4e55" stroke-width="1" stroke-dasharray="2 2"/>`),
  distribuicao: s('distribuicao', `<path d="M20 10h18l14 16v16l-14 14H20l-10-12V22z" fill="none" stroke="${BOR}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="24" cy="22" r="9" fill="${A1}" stroke="${A3}" stroke-width="1.5"/><circle cx="24" cy="22" r="3" fill="${A3}"/><circle cx="42" cy="40" r="7" fill="${A1}" stroke="${A3}" stroke-width="1.5"/><circle cx="42" cy="40" r="2.5" fill="${A3}"/>
    <circle cx="44" cy="20" r="5" fill="#f3f4f6" stroke="${A3}" stroke-width="1.5"/>`),
  bomba: s('bomba', `<path d="M14 20q2-8 12-8h12q10 0 12 10l2 14q0 10-12 12H24q-12-2-12-12z" fill="${A2}" stroke="${A3}" stroke-width="1.5"/>
    <circle cx="32" cy="32" r="11" fill="${A1}" stroke="${A3}" stroke-width="1.2"/>${[0, 60, 120, 180, 240, 300].map((a) => `<path d="M32 32l0-9" stroke="${A3}" stroke-width="2.2" transform="rotate(${a} 32 32)"/>`).join('')}<circle cx="32" cy="32" r="3" fill="${A3}"/>
    <circle cx="17" cy="18" r="2" fill="${A3}"/><circle cx="48" cy="18" r="2" fill="${A3}"/><circle cx="17" cy="46" r="2" fill="${A3}"/><circle cx="48" cy="46" r="2" fill="${A3}"/>`),
  lampada: s('lampada', `<path d="M32 6q9 0 9 11v12q0 4-3 6H26q-3-2-3-6V17q0-11 9-11z" fill="#f7f9fb" stroke="#b9bfc7" stroke-width="1.5"/><path d="M28 20q4-4 8 0" fill="none" stroke="#d6a400" stroke-width="1.6"/><path d="M28 20v9M36 20v9" stroke="${A3}" stroke-width="1"/>
    <rect x="24" y="35" width="16" height="7" fill="${A2}"/><rect x="22" y="42" width="20" height="4" rx="1" fill="${A3}"/><path d="M28 46v10M36 46v10" stroke="${A3}" stroke-width="2.5"/>`),
  escova: s('escova', `<path d="M8 50 52 14" stroke="${BOR}" stroke-width="5" stroke-linecap="round"/><path d="M10 54 54 18" stroke="#46494f" stroke-width="1.5"/><rect x="26" y="27" width="10" height="8" rx="1.5" fill="#4a4f56" transform="rotate(-39 31 31)"/><path d="M31 31l10-14" stroke="${A3}" stroke-width="2.5" stroke-linecap="round"/>`),
  oleo: s('oleo', `<path d="M20 18h18l8 8v28q0 3-3 3H20q-3 0-3-3V21q0-3 3-3z" fill="#1f2226"/><rect x="24" y="10" width="10" height="8" rx="1.5" fill="#d6a400"/><path d="M38 18q8 2 8 8" fill="none" stroke="#1f2226" stroke-width="3"/>
    <rect x="20" y="30" width="23" height="16" rx="1.5" fill="#d6a400"/><path d="M23 35h17M23 39h11" stroke="#1f2226" stroke-width="1.5"/>`),
  liquido: s('liquido', `<path d="M22 20h20v34q0 3-3 3H25q-3 0-3-3z" fill="#f3f4f6" stroke="#b9bfc7" stroke-width="1.5"/><rect x="26" y="11" width="12" height="9" rx="1.5" fill="#d64545"/>
    <rect x="22" y="30" width="20" height="14" fill="#2f63a6"/><path d="M25 35h14M25 39h9" stroke="#f3f4f6" stroke-width="1.4"/><path d="M24 50h16" stroke="#d6dade" stroke-width="2"/>`),
  refrigeracao: s('refrigeracao', `<path d="M22 20h20v34q0 3-3 3H25q-3 0-3-3z" fill="#f3f4f6" stroke="#b9bfc7" stroke-width="1.5"/><rect x="26" y="11" width="12" height="9" rx="1.5" fill="#d64592"/>
    <path d="M23 34h18v19q0 2-2 2H25q-2 0-2-2z" fill="#e889bd"/><rect x="22" y="26" width="20" height="6" fill="#d64592"/>`),
  embraiagem: s('embraiagem', `<circle cx="28" cy="32" r="24" fill="${A2}" stroke="${A3}" stroke-width="1.5"/>${Array.from({ length: 12 }, (_, i) => `<path d="M28 13v10" stroke="${A1}" stroke-width="2.6" transform="rotate(${i * 30} 28 32)"/>`).join('')}<circle cx="28" cy="32" r="7" fill="#eef0f3"/>
    <circle cx="46" cy="44" r="14" fill="#4a4f56" stroke="${BOR}" stroke-width="1.5"/><circle cx="46" cy="44" r="8" fill="${A2}"/><circle cx="46" cy="44" r="3" fill="#eef0f3"/>`),
  cilindro: s('cilindro', `<rect x="14" y="24" width="30" height="16" rx="3" fill="${A2}" stroke="${A3}" stroke-width="1.2"/><rect x="44" y="28" width="10" height="8" rx="1.5" fill="${A3}"/><path d="M14 32H6" stroke="${A3}" stroke-width="3"/><circle cx="24" cy="24" r="4" fill="${BOR}"/><path d="M24 20V8h14" fill="none" stroke="${A3}" stroke-width="2"/>`),
  vela: s('vela', `<rect x="27" y="4" width="10" height="5" rx="1" fill="${A3}"/><path d="M26 9h12l-1 18H27z" fill="#f4f1ea" stroke="#cfc8b8" stroke-width="1"/><path d="M27.5 13h9M27.5 17h9M27.5 21h9" stroke="#cfc8b8" stroke-width="1"/>
    <path d="M23 27h18v8H23z" fill="${A2}" stroke="${A3}" stroke-width="1"/><rect x="26" y="35" width="12" height="13" fill="${A2}"/><path d="M26 38h12M26 41h12M26 44h12" stroke="${A3}" stroke-width="1"/><path d="M32 48v6h5" fill="none" stroke="${A3}" stroke-width="2"/>`),
  sensor: s('sensor', `<path d="M10 14q20-6 18 14t20 16" fill="none" stroke="${BOR}" stroke-width="3"/><rect x="4" y="9" width="12" height="9" rx="2" fill="#4a4f56"/><rect x="44" y="40" width="14" height="10" rx="2" fill="#30343a"/><rect x="47" y="43" width="8" height="4" fill="${A2}"/>`),
  junta: s('junta', `<circle cx="32" cy="32" r="24" fill="${BOR}"/><circle cx="32" cy="32" r="16" fill="#eef0f3"/><circle cx="32" cy="32" r="20" fill="none" stroke="#45494f" stroke-width="1.2"/>`),
  abracadeira: s('abracadeira', `<circle cx="30" cy="34" r="20" fill="none" stroke="${A2}" stroke-width="6"/><circle cx="30" cy="34" r="20" fill="none" stroke="${A3}" stroke-width="1" stroke-dasharray="1.5 2.5"/><rect x="40" y="8" width="12" height="12" rx="2" fill="${A3}"/><circle cx="46" cy="14" r="3" fill="${A1}"/><path d="M44.5 14h3" stroke="${A3}" stroke-width="1.2"/>`),
  fusiveis: s('fusiveis', `${[['#d64545', 10], ['#2f63a6', 26], ['#d6a400', 42]].map(([c, x]) => `<rect x="${x}" y="14" width="12" height="22" rx="2" fill="${c}"/><rect x="${+x + 2}" y="36" width="3" height="14" fill="${A2}"/><rect x="${+x + 7}" y="36" width="3" height="14" fill="${A2}"/>`).join('')}`),
  tensor: s('tensor', `<path d="M14 50 30 30" stroke="${A3}" stroke-width="9" stroke-linecap="round"/><circle cx="14" cy="50" r="5" fill="${A1}" stroke="${A3}" stroke-width="1.5"/><circle cx="36" cy="26" r="16" fill="${A1}" stroke="${A3}" stroke-width="1.5"/><circle cx="36" cy="26" r="9" fill="${A2}"/><circle cx="36" cy="26" r="3" fill="${A3}"/>`),
  termostato: s('termostato', `<circle cx="32" cy="24" r="16" fill="${A1}" stroke="${A3}" stroke-width="1.5"/><circle cx="32" cy="24" r="9" fill="${A2}"/><path d="M26 38q6 3 12 0M25 43q7 3 14 0M26 48q6 3 12 0" fill="none" stroke="${A3}" stroke-width="2"/><rect x="29" y="50" width="6" height="8" rx="1" fill="#d6a400"/>`),
  parafusos: s('parafusos', `${[16, 32, 48].map((x) => `<path d="M${x - 6} 10h12l-2 6h-8z" fill="${A3}"/><rect x="${x - 3}" y="16" width="6" height="34" fill="${A2}"/><path d="M${x - 3} 22h6M${x - 3} 27h6M${x - 3} 32h6M${x - 3} 37h6M${x - 3} 42h6" stroke="${A3}" stroke-width="1"/>`).join('')}`),
  cabo: s('cabo', `<path d="M10 52q10-30 24-26t20-16" fill="none" stroke="#1f2226" stroke-width="5" stroke-linecap="round"/><rect x="46" y="4" width="10" height="14" rx="3" fill="#7a2e2e"/><rect x="4" y="48" width="12" height="10" rx="3" fill="#7a2e2e"/>`),
  caixa: s('caixa', `<path d="M10 22 32 12l22 10v24L32 56 10 46z" fill="#d2b083"/><path d="M10 22l22 10 22-10" fill="none" stroke="#a9875a" stroke-width="1.5"/><path d="M32 32v24" stroke="#a9875a" stroke-width="1.5"/><path d="M21 17l22 10" stroke="#e8d3b2" stroke-width="3"/>`),
};

/** Pela descrição: [palavras, desenho]. A primeira que encaixa ganha (a ordem importa: «kit de rolamento» é rolamento;
    «kit de distribuição com bomba de água» é a distribuição; «líquido de travões» não é travagem). */
const REGRAS: [RegExp, string][] = [
  [/rolamento/i, 'rolamento'], [/pastilha/i, 'pastilhas'], [/disco/i, 'disco'], [/amortecedor|mola/i, 'amortecedor'],
  [/filtro de [óo]leo/i, 'filtro-oleo'], [/filtro de habit/i, 'filtro-habitaculo'], [/filtro/i, 'filtro-ar'],
  [/distribuição/i, 'distribuicao'], [/tensor/i, 'tensor'], [/correia/i, 'correia'], [/bomba de [aá]gua/i, 'bomba'],
  [/termóstato/i, 'termostato'], [/refrigera/i, 'refrigeracao'], [/l[aâ]mpada|farol/i, 'lampada'], [/escova/i, 'escova'],
  [/l[íi]quido/i, 'liquido'], [/[óo]leo/i, 'oleo'], [/parafuso/i, 'parafusos'], [/cilindro/i, 'cilindro'], [/embraiagem|volante/i, 'embraiagem'],
  [/cabo de vela/i, 'cabo'], [/vela/i, 'vela'], [/sensor/i, 'sensor'], [/fus[íi]ve/i, 'fusiveis'],
  [/abraçadeira/i, 'abracadeira'], [/junta|retentor/i, 'junta'],
];
/** A imagem do tipo de peça desta descrição (ou a caixa de cartão). */
export function imagemPeca(descricao: string): string {
  const r = REGRAS.find(([re]) => re.test(descricao));
  return DESENHOS[r ? r[1] : 'caixa'];
}
/** O quadrado com a imagem da peça, para a esquerda de uma linha de artigo (a fotografia, se houver). */
export const azulejoPeca = (descricao: string, cls = '', ref = '') => `<span class="pc-img${cls ? ` ${cls}` : ''}" aria-hidden="true">${ref && FOTOS[ref] ? `<img src="${FOTOS[ref]}" alt="" loading="lazy">` : imagemPeca(descricao)}</span>`;

/** A lista de compras: uma linha por artigo, com a imagem da peça, a descrição, o n.º da linha, a quantidade e o valor
    (o preço unitário não vem nos dados). Igual nas Faturas (o talão) e nas Guias (ela: «nas guias quero mais assim»). */
export function listaCompras(linhas: [number, string, number][], euros: (n: number) => string): string {
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<ol class="fat2__linhas">${linhas.map(([q, d, v], i) => `<li class="fat2__linha" style="--i:${i}">${azulejoPeca(d, 'fat2__l-i')}<span class="fat2__l-desc"><b>${esc(d)}</b><small>Linha ${String(i + 1).padStart(2, '0')}</small></span><span class="fat2__l-q">${q.toLocaleString('pt-PT')} un.</span><span class="fat2__l-v">${euros(v)}</span></li>`).join('')}</ol>`;
}
