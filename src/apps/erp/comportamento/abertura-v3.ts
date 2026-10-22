/* =========================================================
   ERP — 00 · Abertura v3: o comportamento (22 out. 2026)
   - A sequência são classes em .ab3 a horas certas (is-a 150 ms, is-b 400, is-c 750, is-d 1050) e a passagem
     começa aos 1300 ms; o CSS faz o resto. Não há movimento contínuo: depois, só o rato inclina o plano um
     pouco (no toque, nada).
   - A preparação é independente da animação: o «pronto» é a sessão verificada e o destino a existir. Se
     estiver pronto antes, «Saltar introdução» (ou Esc) passa logo; se não estiver no fim, mostra «A preparar
     o ERP…» e passa quando estiver. Nunca se fica preso à animação.
   - A sessão: a da ROMAFE Identity (romafe:sessao, posta ao entrar lá) ou a do ERP (sessao.ts). Com sessão →
     o Início, ou o destino pedido (#…&para=compras). Sem sessão → o login comum (identidade/), sem login do ERP.
     Sem rede → o estado «Sem ligação», e não passa.
   - Uma vez por sessão do navegador; depois, só a marca (≈0,4 s) e segue. Com «reduzir movimento», o mesmo.
   - A passagem sai sozinha só no protótipo (#so=ecra); no editor, a abertura fica na marca.
   ========================================================= */
import { mostrar } from '../../../comum/ecras';
import { faixa, type CenarioV3 } from '../abertura-v3';
import { lerSessao } from '../sessao';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const prototipo = () => document.body.classList.contains('so-ecra');
const VISTA = 'erp:abertura3-vista';
const vista = () => { try { return sessionStorage.getItem(VISTA) === '1'; } catch { return false; } };
const marcarVista = () => { try { sessionStorage.setItem(VISTA, '1'); } catch { /* */ } };
const comSessao = () => { try { if (sessionStorage.getItem('romafe:sessao')) return true; } catch { /* */ } return !!lerSessao(); };

let raiz: HTMLElement | null = null;
let tempos: number[] = [];
let fimDaIntro = false;

function limpar(): void { tempos.forEach((t) => window.clearTimeout(t)); tempos = []; }
const depois = (ms: number, f: () => void) => tempos.push(window.setTimeout(f, ms));
function estado(cen: CenarioV3): void { const el = raiz?.querySelector<HTMLElement>('[data-ab3-estado]'); if (el) el.innerHTML = faixa(cen); }

/** O destino pedido (deep link), se for um ecrã que existe; senão, o Início. */
function destino(): string {
  const p = new URLSearchParams(location.hash.slice(1)).get('para');
  return p && document.querySelector(`.ecra[data-ecra="${CSS.escape(p)}"]`) ? p : 'inicio';
}
/** Leva ao login comum, com o modo em que se está (só o ecrã, a demonstração). */
function irIdentidade(ecra = 'entrada'): void {
  const h = new URLSearchParams(location.hash.slice(1)), q = new URLSearchParams();
  ['so', 'demo', 'anim'].forEach((k) => { const v = h.get(k); if (v) q.set(k, v); });
  q.set('ecra', ecra);
  location.href = '../identidade/#' + q.toString();
}

/* ---------- a escala: o plano de 1000 × 600 cabe na janela ---------- */
function medir(): void {
  if (!raiz) return;
  const w = raiz.clientWidth, h = window.innerHeight;
  raiz.style.setProperty('--k', Math.max(.34, Math.min(w / 1080, h / 680, 1.15)).toFixed(3));
}

/* ---------- a passagem: a marca voa para a da barra do Início (view transition) ---------- */
type DocVT = Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } };
function passar(): void {
  if (!raiz) return;
  const ab = raiz, para = destino();
  ab.classList.add('is-e');
  const marca = ab.querySelector<HTMLElement>('.ab3__marca')!;
  const ir = () => {
    marca.style.viewTransitionName = '';
    limpar(); raiz = null;
    mostrar(para);
    const alvo = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .ws-marca');
    if (alvo) { alvo.style.viewTransitionName = 'erp-marca'; window.setTimeout(() => { alvo.style.viewTransitionName = ''; }, 900); }
  };
  const d = document as DocVT;
  if (!d.startViewTransition || quieto()) { window.setTimeout(ir, 120); return; }
  window.setTimeout(() => { marca.style.viewTransitionName = 'erp-marca'; d.startViewTransition!(ir); }, 200);
}

/** O que vem depois da introdução: a decisão é da sessão e da rede, não da animação. */
function seguir(): void {
  if (!raiz) return;
  fimDaIntro = true;
  if (!navigator.onLine) { estado('offline'); return; }
  if (!comSessao()) { estado('autenticar'); if (prototipo()) depois(1400, () => irIdentidade()); return; }
  if (!prototipo() || editando()) return;
  passar();
}

/* ---------- a sequência ---------- */
const FASES = ['is-a', 'is-b', 'is-c', 'is-d'];
function correr(): void {
  if (!raiz) return;
  limpar(); fimDaIntro = false;
  const cen = raiz.dataset.ab3Cenario as CenarioV3;
  if (cen && cen !== 'normal') return; // os estados do ecrã ficam como estão
  raiz.classList.remove(...FASES, 'is-e', 'is-ja');
  void raiz.offsetWidth;
  if (editando()) { raiz.classList.add(...FASES, 'is-ja'); return; }
  if (quieto() || vista()) { raiz.classList.add(...FASES, 'is-ja'); depois(420, seguir); return; }
  depois(0, () => raiz?.classList.add('is-a'));
  depois(400, () => raiz?.classList.add('is-b'));
  depois(750, () => raiz?.classList.add('is-c'));
  depois(1050, () => { raiz?.classList.add('is-d'); marcarVista(); });
  depois(1300, seguir);
}
function saltar(): void {
  if (!raiz || fimDaIntro) return;
  limpar(); marcarVista();
  raiz.classList.add(...FASES, 'is-ja');
  depois(150, seguir);
}

/* ---------- ligar ---------- */
function armar(): void {
  const r = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .ab3');
  if (r === raiz) return;
  limpar(); raiz = r;
  if (!r) return;
  medir();
  requestAnimationFrame(correr);
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  window.addEventListener('resize', medir);
  document.addEventListener('click', (ev) => {
    if (!raiz || editando()) return;
    const b = (ev.target as Element).closest<HTMLElement>('[data-ab3-saltar], [data-ab3-login], [data-ab3-aplicacoes], [data-ab3-repetir]');
    if (!b || !raiz.contains(b)) return;
    ev.preventDefault(); ev.stopPropagation();
    if (b.matches('[data-ab3-saltar]')) saltar();
    else if (b.matches('[data-ab3-login]')) irIdentidade();
    else if (b.matches('[data-ab3-aplicacoes]')) irIdentidade('aplicacoes');
    else { estado('repetir'); depois(900, () => { estado(navigator.onLine ? 'pronto' : 'offline'); if (navigator.onLine && raiz?.dataset.ab3Cenario === 'normal') seguir(); }); }
  }, true);
  document.addEventListener('keydown', (ev) => { if (raiz && !editando() && ev.key === 'Escape') saltar(); });
  /* o rato inclina o plano um pouco; no toque, nada */
  window.addEventListener('pointermove', (ev) => {
    if (!raiz || ev.pointerType !== 'mouse') return;
    raiz.style.setProperty('--px', ((ev.clientX / innerWidth) * 2 - 1).toFixed(3));
    raiz.style.setProperty('--py', ((ev.clientY / innerHeight) * 2 - 1).toFixed(3));
  }, { passive: true });
  window.addEventListener('online', () => { if (raiz && fimDaIntro && raiz.dataset.ab3Cenario === 'normal') { estado('pronto'); seguir(); } });
  window.addEventListener('offline', () => { if (raiz && fimDaIntro) estado('offline'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && raiz && !fimDaIntro) saltar(); });
}
