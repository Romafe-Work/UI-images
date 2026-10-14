/* =========================================================
   GOPARTS — 00 · Abertura: quando e como corre a cena 3D (14 out. 2026)
   - Quando a abertura aparece, escolhe o modo:
       «completa» — na primeira vez da sessão: carrega a cena (import dinâmico de abertura-cena.ts,
                    com o Three.js) e corre a sequência; no fim passa à página pública;
       «curta»    — já se viu nesta sessão (sessionStorage): mostra só o logótipo e «Ver outra vez»;
       «parada»   — «reduzir movimento», sem WebGL, ou um aparelho fraco (pouca memória, poupança de
                    dados): o logótipo aparece com um desvanecer curto.
     Não há percentagem: enquanto a cena carrega, se demorar, aparece «A preparar a cena…».
   - «Saltar» e Esc passam já à página pública. A passagem é um elemento partilhado: a marca do centro
     voa para a barra da página pública (View Transitions).
   - Ao sair da abertura, a cena larga tudo (o ciclo, os ouvintes e o contexto WebGL).
   - No editor não passa sozinha à página pública. Com #…&pausa=3.3 no endereço, a sequência fica
     parada nesse instante (para rever um momento).
   ========================================================= */
import { mostrar } from '../../../comum/ecras';
import type { Cena } from './abertura-cena';

const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const VISTA = 'goparts:abertura-vista';
/** #…&pausa=3.3 para a sequência num instante (para rever um momento); conta sempre como primeira vez */
const pausa = () => { const m = /[#&]pausa=([\d.]+)/.exec(location.hash); return m ? Number(m[1]) : undefined; };
const lerVista = () => { try { return sessionStorage.getItem(VISTA) === '1'; } catch { return false; } };
const marcarVista = () => { try { sessionStorage.setItem(VISTA, '1'); } catch { /* sem armazenamento: volta a passar */ } };

function fraco(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return true;
  if ((nav.deviceMemory ?? 8) <= 2 || (navigator.hardwareConcurrency ?? 8) <= 2) return true;
  try { const c = document.createElement('canvas'); return !(c.getContext('webgl2') || c.getContext('webgl')); } catch { return true; }
}

let cena: Cena | null = null;
let raiz: HTMLElement | null = null;
let espera = 0, saida = 0;

function largar(): void {
  window.clearTimeout(espera); window.clearTimeout(saida);
  if (cena) {
    cena.destruir(); cena = null;
    /* o contexto WebGL perdido fica preso ao canvas: para voltar a correr, um canvas novo */
    const cv = raiz?.querySelector('canvas'); cv?.replaceWith(cv.cloneNode());
  }
  raiz?.classList.remove('is-cena', 'is-marca', 'is-goparts', 'is-linha', 'is-final', 'is-parada', 'is-cotas', 'is-espera');
  raiz = null;
}

/** Passa à página pública: a marca do centro voa para a da barra. */
function seguir(): void {
  const ab = raiz;
  if (!ab) { mostrar('publico'); return; }
  const doc = document as Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } };
  const daqui = ab.querySelector<HTMLElement>('.ab5__marca');
  const ir = () => {
    if (daqui) daqui.style.viewTransitionName = '';
    largar();
    mostrar('publico');
    const ali = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .pub__marca');
    if (ali) { ali.style.viewTransitionName = 'goparts-marca'; window.setTimeout(() => { ali.style.viewTransitionName = ''; }, 1200); }
  };
  if (!doc.startViewTransition || quieto() || !daqui) { ir(); return; }
  /* só a marca voa; o resto troca com um desvanecer */
  daqui.style.viewTransitionName = 'goparts-marca';
  doc.startViewTransition(ir);
}

/** A sequência acabou (ou é a curta): o logótipo fica, e passa sozinha à página pública. */
function mostrarFinal(depois: number): void {
  if (!raiz) return;
  raiz.classList.add('is-marca', 'is-goparts', 'is-linha', 'is-final');
  raiz.querySelector<HTMLElement>('[data-repetir]')!.hidden = false;
  if (!editando()) saida = window.setTimeout(seguir, depois);
}

/** A linha do tempo do que é HTML (o logótipo, o GoParts, a linha), ao mesmo relógio da cena. */
function marcarTempos(ab: HTMLElement, T: { logotipo: number; goparts: number; linha: number }): void {
  const t0 = performance.now(), p = pausa();
  const passo = () => {
    if (raiz !== ab) return;
    const t = p ?? (performance.now() - t0) / 1000;
    ab.classList.toggle('is-marca', t >= T.logotipo);
    ab.classList.toggle('is-goparts', t >= T.goparts);
    ab.classList.toggle('is-linha', t >= T.linha);
    if (p === undefined && t < T.linha + 0.1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

async function correr(ab: HTMLElement, forcar = false): Promise<void> {
  largar();
  raiz = ab;
  ab.querySelector<HTMLElement>('[data-repetir]')!.hidden = true;
  if (quieto() || fraco()) { ab.classList.add('is-parada'); requestAnimationFrame(() => mostrarFinal(2200)); return; }
  if (lerVista() && !forcar && pausa() === undefined) { mostrarFinal(1400); return; }
  marcarVista();
  espera = window.setTimeout(() => ab.classList.add('is-espera'), 500);
  const { Cena: C, T } = await import('./abertura-cena');
  if (raiz !== ab) return;
  window.clearTimeout(espera); ab.classList.remove('is-espera');
  await document.fonts.load(`120px Motor`).catch(() => {});
  if (raiz !== ab) return;
  const cotas = new Map<string, { linha: SVGLineElement; ponto: SVGCircleElement; rotulo: HTMLElement }>();
  ab.querySelectorAll<SVGGElement>('.ab5__cota').forEach((g) => cotas.set(g.dataset.cota!, { linha: g.querySelector('line')!, ponto: g.querySelector('circle')!, rotulo: ab.querySelector<HTMLElement>(`.ab5__rotulo[data-cota="${g.dataset.cota}"]`)! }));
  try {
    cena = new C({ pausa: pausa(), canvas: ab.querySelector('canvas')!, marca: ab.querySelector('.ab5__marca')!, cotas, fundo: () => getComputedStyle(ab).getPropertyValue('--ab5-fundo').trim() || '#06131f' });
  } catch { ab.classList.add('is-parada'); mostrarFinal(2200); return; }
  ab.classList.add('is-cena');
  cena.comecar(() => mostrarFinal(600));
  marcarTempos(ab, T);
}

function armar(): void {
  const ab = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .abertura--v5');
  if (ab === raiz) return;
  if (!ab) { largar(); return; }
  correr(ab);
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  /* «Saltar» com a marca a voar (antes da navegação do protótipo); «Ver outra vez»; Esc salta */
  window.addEventListener('click', (ev) => {
    if (editando() || !raiz) return;
    const alvo = ev.target as Element;
    if (alvo.closest?.('.abertura--v5 .abertura__saltar')) { ev.preventDefault(); ev.stopPropagation(); seguir(); }
    else if (alvo.closest?.('.abertura--v5 [data-repetir]')) { ev.preventDefault(); correr(raiz, true); }
  }, true);
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && raiz && !editando()) seguir(); });
  /* o fundo da cena segue o tema */
  new MutationObserver(() => cena?.pintarFundo()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => cena?.pintarFundo());
}
