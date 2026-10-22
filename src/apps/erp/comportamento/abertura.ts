/* =========================================================
   ERP — 00 · Abertura: quando e como corre a cena (19 out. 2026), como a do Peça A Peça
   - Quando a abertura aparece, escolhe o modo:
       «completa» — na primeira vez da sessão: carrega a cena (import dinâmico de abertura-cena.ts, com o
                    Three.js) e corre a sequência; aos 4,2 s põe a rede da v10 por baixo (rede.ts); no fim
                    passa ao 01 · Entrar da v10;
       «curta»    — já se viu nesta sessão (sessionStorage): mostra o logótipo, a rede e «Ver outra vez»;
       «parada»   — «reduzir movimento», sem WebGL, ou um aparelho fraco: o logótipo com um desvanecer curto.
   - «Saltar» e Esc passam já ao 01. A marca do centro voa para a do cartão (View Transitions); a rede é a
     mesma cena e o mesmo canvas, que rede.ts muda para o palco do 01.
   - Ao sair da abertura, a cena do rolamento larga tudo (o ciclo, os ouvintes e o contexto WebGL); a rede não.
   - No editor não passa sozinha ao 01. Com #…&pausa=3.6 no endereço, a sequência fica parada nesse instante.
   ========================================================= */
import { mostrar, mostrarVersao } from '../../../comum/ecras';
import { VERSAO_REDE } from '../entrar-rede';
import { redeNaAbertura } from './rede';
import type { Cena } from './abertura-cena';

const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const VISTA = 'erp:abertura-vista';
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

const cores = () => {
  const s = getComputedStyle(raiz ?? document.documentElement);
  return { aco: s.getPropertyValue('--erp-ab-aco').trim() || '#8a96a3', marca: s.getPropertyValue('--c-logotipo').trim() || '#0063aa' };
};

function largar(): void {
  window.clearTimeout(espera); window.clearTimeout(saida);
  if (cena) {
    cena.destruir(); cena = null;
    /* o contexto WebGL perdido fica preso ao canvas: para voltar a correr, um canvas novo */
    const cv = raiz?.querySelector('canvas.erp-ab__cena'); cv?.replaceWith(cv.cloneNode());
  }
  raiz?.classList.remove('is-cena', 'is-marca', 'is-erp', 'is-linha', 'is-final', 'is-parada', 'is-cotas', 'is-espera', 'is-rede');
  raiz = null;
}

/** Passa ao 01 · Entrar da v10: a marca do centro voa para a do cartão. */
function seguir(): void {
  const ab = raiz;
  /* (22 out.) só segue se esta abertura (a v1) ainda estiver à vista: um temporizador antigo não pode levar ao
     Entrar quando se está noutra versão (a v3 passa ao Início) ou noutro ecrã */
  if (!ab || !ab.isConnected || ab.closest('.versao[hidden], .ecra[hidden]')) return;
  const ir = () => {
    if (daqui) daqui.style.viewTransitionName = '';
    largar();
    mostrar('entrada'); mostrarVersao(VERSAO_REDE);
    const ali = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .rede__marca');
    if (ali) { ali.style.viewTransitionName = 'erp-marca'; window.setTimeout(() => { ali.style.viewTransitionName = ''; }, 1200); }
  };
  const daqui = ab?.querySelector<HTMLElement>('.erp-ab__marca') ?? null;
  const doc = document as Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } };
  if (!ab || !doc.startViewTransition || quieto() || !daqui) { ir(); return; }
  daqui.style.viewTransitionName = 'erp-marca';
  doc.startViewTransition(ir);
}

function comRede(ab: HTMLElement): void {
  if (ab.classList.contains('is-rede')) return;
  ab.classList.add('is-rede');
  redeNaAbertura(ab.querySelector<HTMLElement>('.erp-ab__rede')!);
}

/** A sequência acabou (ou é a curta): o logótipo fica, e passa sozinha ao 01. */
function mostrarFinal(depois: number): void {
  if (!raiz) return;
  raiz.classList.add('is-marca', 'is-erp', 'is-linha', 'is-final');
  comRede(raiz);
  raiz.querySelector<HTMLElement>('[data-ab-repetir]')!.hidden = false;
  if (!editando()) saida = window.setTimeout(seguir, depois);
}

/** A linha do tempo do que é HTML (a rede, o logótipo, o ERP, a linha), ao mesmo relógio da cena. */
function marcarTempos(ab: HTMLElement, T: { rede: number; logotipo: number; erp: number; linha: number }): void {
  const t0 = performance.now(), p = pausa();
  const passo = () => {
    if (raiz !== ab) return;
    const t = p ?? (performance.now() - t0) / 1000;
    if (t >= T.rede) comRede(ab);
    ab.classList.toggle('is-marca', t >= T.logotipo);
    ab.classList.toggle('is-erp', t >= T.erp);
    ab.classList.toggle('is-linha', t >= T.linha);
    if (p === undefined && t < T.linha + 0.1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

async function correr(ab: HTMLElement, forcar = false): Promise<void> {
  largar();
  raiz = ab;
  ab.querySelector<HTMLElement>('[data-ab-repetir]')!.hidden = true;
  if (quieto() || fraco()) { ab.classList.add('is-parada'); requestAnimationFrame(() => mostrarFinal(2200)); return; }
  if (lerVista() && !forcar && pausa() === undefined) { mostrarFinal(1600); return; }
  marcarVista();
  espera = window.setTimeout(() => ab.classList.add('is-espera'), 500);
  const { Cena: C, T } = await import('./abertura-cena');
  if (raiz !== ab) return;
  window.clearTimeout(espera); ab.classList.remove('is-espera');
  await document.fonts.load('120px Motor').catch(() => {});
  if (raiz !== ab) return;
  const cotas = new Map<string, { linha: SVGLineElement; ponto: SVGCircleElement; rotulo: HTMLElement }>();
  ab.querySelectorAll<SVGGElement>('.erp-ab__cota').forEach((g) => cotas.set(g.dataset.cota!, { linha: g.querySelector('line')!, ponto: g.querySelector('circle')!, rotulo: ab.querySelector<HTMLElement>(`.erp-ab__rotulo[data-cota="${g.dataset.cota}"]`)! }));
  try {
    cena = new C({ pausa: pausa(), canvas: ab.querySelector<HTMLCanvasElement>('canvas.erp-ab__cena')!, logotipo: ab.querySelector<HTMLElement>('.erp-ab__romafe')!, cotas, cores });
  } catch { ab.classList.add('is-parada'); mostrarFinal(2200); return; }
  ab.classList.add('is-cena');
  cena.comecar(() => mostrarFinal(700));
  marcarTempos(ab, T);
}

function armar(): void {
  const ab = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .erp-ab');
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
    if (alvo.closest?.('.erp-ab .erp-ab__saltar')) { ev.preventDefault(); ev.stopPropagation(); seguir(); }
    else if (alvo.closest?.('.erp-ab [data-ab-repetir]')) { ev.preventDefault(); correr(raiz, true); }
  }, true);
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && raiz && !editando()) seguir(); });
  /* as partículas seguem o tema */
  new MutationObserver(() => requestAnimationFrame(() => cena?.pintar())).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => cena?.pintar());
}
