/* =========================================================
   ERP — 00 · Abertura v4 (22 out. 2026), do briefing dela «ROMAFE ERP V2 — Minimal Cinematic Opening Redesign»
   Ela: «demasiado conteúdo, parece uma página de login genérica». Fica só o essencial: o ROMAFE e o ERP ao
   centro, e por trás uma só estrutura mecânica — os anéis de um rolamento, maquinados, que se montam:
     0–200 ms    o fundo aparece;
     200–750 ms  os segmentos do anel exterior, a coroa dos rolos e o anel interior encaixam (≈550 ms);
     550–800 ms  o ROMAFE aparece;
     800–1000 ms o ERP; a marca laranja de alinhamento acende no anel (o único laranja da cena).
   Depois, parado. Sem slogans, sem risco, sem cadeado, sem parágrafos. Com sessão, segue para o Início (a marca
   passa à da barra); sem sessão, um só botão, «Iniciar sessão», para o login comum (ROMAFE Identity); os
   estados de falha são uma frase curta e uma ação. Tudo em SVG e CSS (transform e opacidade).
   A v3 saiu (ela: «só quero uma versão»); o código dela fica em abertura-v3.ts.
   ========================================================= */
import type { EcraErp } from './ids';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import rotateCw from 'lucide-static/icons/rotate-cw.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-lucide="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');

export const VERSAO_ABERTURA_V4 = 'v4';

/* ---------- a estrutura: um rolamento visto de frente, em segmentos maquinados (viewBox de 1000 × 1000) ---------- */
const f = (n: number) => n.toFixed(1);
/** um segmento de coroa entre os raios r1 e r2, dos ângulos a0 a a1 (graus, 0 = em cima) */
function coroa(r1: number, r2: number, a0: number, a1: number): string {
  const p = (r: number, a: number) => { const t = ((a - 90) * Math.PI) / 180; return `${f(Math.cos(t) * r)} ${f(Math.sin(t) * r)}`; };
  const grande = a1 - a0 > 180 ? 1 : 0;
  return `M${p(r2, a0)} A${r2} ${r2} 0 ${grande} 1 ${p(r2, a1)} L${p(r1, a1)} A${r1} ${r1} 0 ${grande} 0 ${p(r1, a0)} Z`;
}
/** n segmentos com uma folga de «junta» entre eles; cada um entra de fora, ao longo da sua bissetriz */
function anel(cls: string, r1: number, r2: number, n: number, folga: number, fuga: number, rot: number): string {
  return Array.from({ length: n }, (_, i) => {
    const a0 = (360 / n) * i + folga / 2, a1 = (360 / n) * (i + 1) - folga / 2, meio = ((a0 + a1) / 2 - 90) * Math.PI / 180;
    return `<path class="${cls}" d="${coroa(r1, r2, a0, a1)}" style="--dx:${f(Math.cos(meio) * fuga)}px;--dy:${f(Math.sin(meio) * fuga)}px;--rot:${rot}deg;--i:${i}"/>`;
  }).join('');
}
const N_ROLOS = 28;
let nEstrutura = 0;
function estrutura(): string {
  /* ids próprios em cada cópia: um gradiente num ecrã escondido não pinta os outros */
  const k = `ab4-${++nEstrutura}`;
  const rolos = Array.from({ length: N_ROLOS }, (_, i) => `<rect class="ab4__rolo" x="-14" y="-412" width="28" height="58" rx="11" transform="rotate(${f((360 / N_ROLOS) * i)})"/>`).join('');
  const riscas = Array.from({ length: 180 }, (_, i) => { const t = (i * 2 * Math.PI) / 180, r1 = i % 5 ? 482 : 476; return `<line x1="${f(Math.cos(t) * r1)}" y1="${f(Math.sin(t) * r1)}" x2="${f(Math.cos(t) * 490)}" y2="${f(Math.sin(t) * 490)}"/>`; }).join('');
  return `<svg class="ab4__mecanismo" viewBox="-500 -500 1000 1000" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${k}-aco" x1="0" y1="-1" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#2a4058"/><stop offset=".45" stop-color="#1b2c3e"/><stop offset="1" stop-color="#121e2b"/></linearGradient>
      <linearGradient id="${k}-aco-claro" x1="0" y1="-1" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#34506c"/><stop offset=".5" stop-color="#20344a"/><stop offset="1" stop-color="#152435"/></linearGradient>
      <radialGradient id="${k}-rolo" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#3b5a78"/><stop offset="1" stop-color="#16263a"/></radialGradient>
    </defs>
    <g class="ab4__riscas">${riscas}</g>
    <g class="ab4__exterior" fill="url(#${k}-aco)">${anel('ab4__seg', 420, 470, 6, 1.2, 140, -14)}</g>
    <circle class="ab4__chanfro" r="426"/>
    <g class="ab4__coroa" fill="url(#${k}-rolo)">${rolos}</g>
    <g class="ab4__interior" fill="url(#${k}-aco-claro)">${anel('ab4__seg ab4__seg--int', 300, 346, 4, 1, 90, 12)}</g>
    <circle class="ab4__chanfro" r="340"/>
    <rect class="ab4__marcador" x="-3" y="-470" width="6" height="34" rx="2"/>
  </svg>`;
}

/* ---------- os cenários ---------- */
export type CenarioV4 = 'normal' | 'iniciar' | 'animacao' | 'autenticado' | 'sem-sessao' | 'verificar' | 'falhou' | 'sem-acesso' | 'offline' | 'redirecionar';
export type IdAberturaV4 = `ab4-${Exclude<CenarioV4, 'normal'>}`;

/** A ação por baixo do ERP: só quando é precisa (sem sessão, ou numa falha). Sem parágrafos. */
export function acao(cen: CenarioV4): string {
  const btn = (t: string, i: string, extra: string, cls = 'btn--acao') => `<button type="button" class="btn ${cls} ab4__btn"${extra}><span class="btn__rotulo">${t}</span>${L(i, 'btn__icone')}</button>`;
  const msg = (t: string) => `<p class="ab4__msg">${t}</p>`;
  switch (cen) {
    case 'sem-sessao': return btn('Iniciar sessão', arrowRight, ' data-ab4-login');
    case 'verificar': case 'iniciar': return `<span class="ab4__espera" role="status"><span class="sr-only">${cen === 'iniciar' ? 'A preparar o ERP' : 'A verificar a sessão'}</span></span>`;
    case 'redirecionar': return `<span class="ab4__espera" role="status"><span class="sr-only">A abrir o ERP</span></span>`;
    case 'falhou': return `${msg('Não foi possível verificar a sessão.')}${btn('Tentar de novo', rotateCw, ' data-ab4-repetir', 'btn--secundario')}`;
    case 'sem-acesso': return `${msg('Esta conta não tem acesso ao ERP.')}${btn('Escolher aplicação', layoutGrid, ' data-ab4-aplicacoes', 'btn--secundario')}`;
    case 'offline': return `${msg('Sem ligação.')}${btn('Tentar de novo', rotateCw, ' data-ab4-repetir', 'btn--secundario')}`;
    default: return '';
  }
}
/* as fases que cada estado do ecrã mostra, parado */
const FASES: Record<CenarioV4, string> = {
  normal: '', iniciar: 'is-a', animacao: 'is-a is-b', autenticado: 'is-a is-b is-c is-d is-fim', 'sem-sessao': 'is-a is-b is-c is-d is-fim', verificar: 'is-a is-b is-c is-d is-fim',
  falhou: 'is-a is-b is-c is-d is-fim', 'sem-acesso': 'is-a is-b is-c is-d is-fim', offline: 'is-a is-b is-c is-d is-fim', redirecionar: 'is-a is-b is-c is-d is-fim is-e',
};

function html(cen: CenarioV4): string {
  return `<main class="ab4 ${FASES[cen]}" data-ab4 data-ab4-cenario="${cen}" aria-label="ROMAFE ERP">
  <div class="ab4__fundo" aria-hidden="true"></div>
  <div class="ab4__palco" aria-hidden="true">${estrutura()}</div>
  <div class="ab4__centro">
    <h1 class="ab4__marca"><span class="romafe ab4__romafe">ROMAFE</span><span class="ab4__erp">ERP</span></h1>
    <div class="ab4__acao" data-ab4-acao aria-live="polite">${acao(cen)}</div>
  </div>
</main>`;
}

const NOTA = 'A abertura v4 (22 out., briefing «Minimal Cinematic Opening»): só o ROMAFE e o ERP; por trás, os anéis de um rolamento maquinado montam-se em ≈0,6 s; «Iniciar sessão» só sem sessão';
export const versaoAberturaV4 = () => ({ id: VERSAO_ABERTURA_V4, nota: NOTA, html: html('normal') });

export function estadosAberturaV4(): EcraErp[] {
  const e = (cen: Exclude<CenarioV4, 'normal'>, nome: string, objetivo: string): EcraErp =>
    ({ id: `ab4-${cen}` as IdAberturaV4, nome, fluxo: 'Entrar', estadoDe: 'abertura', objetivo, versoes: [{ id: VERSAO_ABERTURA_V4, nota: NOTA, html: html(cen) }] });
  return [
    e('iniciar', '00.1 · A iniciar', 'O fundo já está e o ERP ainda a carregar: o mecanismo por montar e um traço fino a correr por baixo da marca.'),
    e('animacao', '00.2 · Montado', 'Os segmentos dos anéis e a coroa dos rolos acabados de encaixar, antes de aparecer a marca.'),
    e('autenticado', '00.3 · Com sessão', 'Montado, com sessão: nenhum botão — segue sozinho para o Início.'),
    e('sem-sessao', '00.4 · Sem sessão', 'Montado, sem sessão: um só botão, «Iniciar sessão», que leva ao login comum.'),
    e('verificar', '00.5 · A verificar a sessão', 'Só enquanto o servidor confirma a sessão: um traço fino por baixo da marca; nada para carregar.'),
    e('falhou', '00.6 · A verificação falhou', 'Uma frase e «Tentar de novo».'),
    e('sem-acesso', '00.7 · Sem acesso', 'A conta não tem o ERP: uma frase e «Escolher aplicação» (volta à ROMAFE Identity).'),
    e('offline', '00.8 · Sem ligação', 'Sem rede: «Sem ligação.» e «Tentar de novo».'),
    e('redirecionar', '00.9 · A abrir', 'A seguir para o Início: o mecanismo recua e a marca passa à da barra.'),
  ];
}
