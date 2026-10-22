/* =========================================================
   ERP — 00 · Abertura v6 «The Enterprise Engine» (22 out. 2026), do briefing dela «ROMAFE ERP V3 — Seamless
   authentication, cinematic opening & main workspace» e da nota: «o efeito wow mais importante é a transição
   entre a abertura e a página principal: o logótipo ROMAFE ERP desloca-se suavemente para a posição real no
   header, enquanto o menu lateral e a área de trabalho surgem».
   Como no Peça A Peça: login comum (ROMAFE Identity) → esta abertura → a página principal, sozinha. Sem campos,
   sem «Iniciar sessão», sem frases. A abertura desenha-se POR CIMA da própria página principal (o Início v3):
     0–200 ms     o fundo escuro e as linhas de arquitetura; um sinal laranja acende o primeiro anel;
     200–500 ms   os anéis de precisão rodam até alinhar; o documento e o pacote chegam pelos seus caminhos;
     500–850 ms   as ligações fecham, tudo converge numa só estrutura e a câmara recua um pouco;
     850–1100 ms  ROMAFE ERP;
     1100–1500 ms a marca desliza (FLIP) para o sítio dela no cabeçalho, o fundo da abertura dá lugar ao da área
                  de trabalho, o menu lateral entra e o painel de Compras e o resto aparecem em cascata.
   Depois mostra-se o 05 · Início (o mesmo desenho, por isso não há corte). Só uma vez por sessão; na navegação
   interna nunca volta. Os estados (sessão, acesso, rede, menus) são uma frase e, quando é preciso, uma ação.
   Tudo SVG e CSS; o movimento da marca é com a Web Animations API.
   ========================================================= */
import type { EcraErp } from './ids';
import { PECAS, caixa } from './abertura-v3';
import { paginaEspaco } from './espaco';
import skipForward from 'lucide-static/icons/skip-forward.svg?raw';
import rotateCw from 'lucide-static/icons/rotate-cw.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-lucide="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
export const VERSAO_ABERTURA_V6 = 'v6';

/* ---------- o motor: anéis de precisão, o documento, o pacote e a estrutura, num plano de 800 × 500 ---------- */
function anel(r: number, n: number, cls: string): string {
  const riscas = Array.from({ length: n }, (_, i) => { const t = (i / n) * Math.PI * 2, r2 = r - (i % 6 ? 6 : 12); return `<line x1="${(Math.cos(t) * r).toFixed(1)}" y1="${(Math.sin(t) * r).toFixed(1)}" x2="${(Math.cos(t) * r2).toFixed(1)}" y2="${(Math.sin(t) * r2).toFixed(1)}"/>`; }).join('');
  return `<g class="${cls}"><circle r="${r}"/>${riscas}</g>`;
}
function motor(): string {
  const fuga = Array.from({ length: 13 }, (_, i) => `<line x1="${400 + (i - 6) * 34}" y1="250" x2="${400 + (i - 6) * 210}" y2="520"/>`).join('')
    + Array.from({ length: 5 }, (_, k) => { const y = 250 + 270 * ((k + 1) / 6) ** 1.6; return `<line x1="-200" y1="${y.toFixed(1)}" x2="1000" y2="${y.toFixed(1)}"/>`; }).join('');
  const doc = PECAS.find((p) => p.id === 'documento')!.svg, pac = PECAS.find((p) => p.id === 'pacote')!.svg;
  return `<svg class="ab6__cena" viewBox="0 0 800 500" aria-hidden="true" focusable="false">
    <g class="ab6__arq">${fuga}<path d="M0 90 L330 30 L800 120"/><path d="M330 30 V250"/></g>
    <g class="ab6__ligacoes"><path d="M190 270 H290 L330 250" pathLength="1"/><path d="M610 270 H510 L470 250" pathLength="1"/><path d="M400 380 V320" pathLength="1"/></g>
    <g transform="translate(400 380)"><g class="ab6__estrutura">${caixa(-70, -70, 0, 140, 140, 10, ' ab6-base')}${caixa(-52, -52, 14, 104, 104, 10, ' ab6-base')}</g></g>
    <g class="ab6__aneis" transform="translate(400 250)">
      ${anel(120, 96, 'ab6__anel ab6__anel--ext')}${anel(86, 72, 'ab6__anel ab6__anel--int')}
      <circle class="ab6__furo" r="48"/>
      <circle class="ab6__sinal" r="5" cx="0" cy="-120"/>
    </g>
    <g class="ab6__doc"><g transform="translate(190 262) scale(1.6)">${doc}</g></g>
    <g class="ab6__pac"><g transform="translate(610 268) scale(1.4)">${pac}</g></g>
  </svg>`;
}

export type CenarioV6 = 'normal' | 'iniciar' | 'sem-acesso' | 'offline' | 'menus' | 'navegacao' | 'saltada';
export type IdAberturaV6 = `ab6-${Exclude<CenarioV6, 'normal'>}`;

/** O estado, por baixo da marca: só quando há alguma coisa a dizer. */
export function estadoV6(cen: CenarioV6): string {
  const btn = (t: string, i: string, extra: string) => `<button type="button" class="ab6__btn"${extra}>${L(i)}<span>${t}</span></button>`;
  switch (cen) {
    case 'iniciar': return '<p class="ab6__msg"><span class="ab6__traco" aria-hidden="true"></span>A preparar o ERP…</p>';
    case 'sem-acesso': return `<p class="ab6__msg">Esta conta não tem acesso ao ERP.</p>${btn('Escolher outra aplicação', layoutGrid, ' data-ab6-aplicacoes')}`;
    case 'offline': return `<p class="ab6__msg">Sem ligação.</p>${btn('Tentar de novo', rotateCw, ' data-ab6-repetir')}`;
    case 'menus': return `<p class="ab6__msg">Os módulos não carregaram.</p>${btn('Tentar de novo', rotateCw, ' data-ab6-repetir')}`;
    case 'navegacao': return `<p class="ab6__msg">Não foi possível abrir esta página do ERP.</p>${btn('Ir para o Início', layoutGrid, ' data-ab6-inicio')}`;
    default: return '';
  }
}
const FASES: Record<CenarioV6, string> = {
  normal: '', iniciar: 'is-a is-b is-c is-d', 'sem-acesso': 'is-a is-b is-c is-d', offline: 'is-a is-b is-c is-d', menus: 'is-a is-b is-c is-d', navegacao: 'is-a is-b is-c is-d', saltada: 'is-a is-b is-c is-d is-ja',
};
function html(cen: CenarioV6): string {
  const camada = `<div class="ab6 ${FASES[cen]}" data-por-cima data-ab6 data-ab6-cenario="${cen}" role="status" aria-label="ROMAFE ERP a abrir">
    <div class="ab6__fundo"></div>
    ${motor()}
    <div class="ab6__centro">
      <p class="ab6__marca"><span class="romafe ab6__romafe">ROMAFE</span><i aria-hidden="true"></i><span class="ab6__erp">ERP</span></p>
      <div class="ab6__estado" data-ab6-estado aria-live="polite">${estadoV6(cen)}</div>
    </div>
    <button type="button" class="ab6__saltar" data-ab6-saltar>${L(skipForward)}<span>Saltar</span></button>
  </div>`;
  /* enquanto a abertura tapa a página, a página por baixo não se lê nem se alcança com o teclado */
  return paginaEspaco(undefined, camada).replace(/^<div class="hm sh([^"]*)" data-hm data-sh>/, '<div class="hm sh$1 is-abertura" data-hm data-sh data-sh-abertura>').replace('<div class="sh-corpo', '<div aria-hidden="true" inert class="sh-corpo');
}

const NOTA = 'A abertura v6 «The Enterprise Engine» (22 out., briefing «ERP V3»): os anéis de precisão, o documento e o pacote juntam-se numa estrutura, aparece ROMAFE ERP e a marca desliza para o cabeçalho enquanto o menu e a área de trabalho surgem — sozinha, depois do login comum';
export const versaoAberturaV6 = () => ({ id: VERSAO_ABERTURA_V6, nota: NOTA, html: html('normal') });
export function estadosAberturaV6(): EcraErp[] {
  const e = (cen: Exclude<CenarioV6, 'normal'>, nome: string, objetivo: string): EcraErp => ({ id: `ab6-${cen}` as IdAberturaV6, nome, fluxo: 'Entrar', estadoDe: 'abertura', objetivo, versoes: [{ id: VERSAO_ABERTURA_V6, nota: NOTA, html: html(cen) }] });
  return [
    e('iniciar', '00.1 · A preparar o ERP', 'A marca já está e o ERP ainda a carregar (os módulos do perfil, o contexto): um traço fino a correr, sem fingir que está pronto.'),
    e('sem-acesso', '00.2 · Sem acesso ao ERP', 'A conta entrou, mas não tem o ERP: uma frase e «Escolher outra aplicação»; não se entra no ERP.'),
    e('offline', '00.3 · Sem ligação', 'Sem rede: «Sem ligação.» e «Tentar de novo».'),
    e('menus', '00.4 · Os módulos não carregaram', 'O serviço dos módulos não respondeu: «Tentar de novo».'),
    e('navegacao', '00.5 · Página não encontrada', 'O endereço pedido não é de uma página do ERP: «Ir para o Início».'),
    e('saltada', '00.6 · Introdução saltada', '«Saltar», Esc, ou já vista nesta sessão: a marca aparece e passa logo para o cabeçalho.'),
  ];
}
