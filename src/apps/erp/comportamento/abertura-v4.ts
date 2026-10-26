/* =========================================================
   ERP — 00 · Abertura v4: o comportamento (22 out. 2026)
   - A sequência são classes em .ab4 (is-a 0 ms, is-b 200, is-c 550, is-d 800, is-fim 1000); o CSS faz o resto.
     Depois, parado: nada em ciclo.
   - Interativo logo: «Iniciar sessão» funciona desde o primeiro instante; Esc ou um clique no fundo acabam a
     sequência. A animação nunca segura ninguém.
   - A sessão é a da ROMAFE Identity (romafe:sessao) ou a do ERP (sessao.ts). Com sessão → o Início, ou o destino
     pedido (#…&para=compras), com a marca a passar à da barra (só no protótipo, #so=ecra; no editor fica parada).
     Sem sessão → só o botão «Iniciar sessão» (o login comum). Sem rede → «Sem ligação.» e «Tentar de novo».
   - Uma vez por sessão do navegador; depois, ou com «reduzir movimento», tudo no sítio logo.
   - irIdentidade() e os botões data-login (a sessão que terminou, «Terminar sessão») levam ao login comum.
   ========================================================= */
import { mostrar } from '../../../comum/ecras';
import { acao, type CenarioV4 } from '../abertura-v4';
import { lerSessao } from '../sessao';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* no editor, com «Interagir» ligado (26 out.), o ecrã responde como no protótipo */
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
const prototipo = () => document.body.classList.contains('so-ecra');
const VISTA = 'erp:abertura4-vista';
const vista = () => { try { return sessionStorage.getItem(VISTA) === '1'; } catch { return false; } };
const marcarVista = () => { try { sessionStorage.setItem(VISTA, '1'); } catch { /* */ } };
const comSessao = () => { try { if (sessionStorage.getItem('romafe:sessao')) return true; } catch { /* */ } return !!lerSessao(); };

/** Leva ao login comum (ROMAFE Identity), com o modo em que se está (só o ecrã, a demonstração). */
export function irIdentidade(ecra = 'entrada'): void {
  const h = new URLSearchParams(location.hash.slice(1)), q = new URLSearchParams();
  ['so', 'demo', 'anim'].forEach((k) => { const v = h.get(k); if (v) q.set(k, v); });
  q.set('ecra', ecra);
  location.href = '../identidade/#' + q.toString();
}

let raiz: HTMLElement | null = null;
let tempos: number[] = [];
function limpar(): void { tempos.forEach((t) => window.clearTimeout(t)); tempos = []; }
const depois = (ms: number, f: () => void) => tempos.push(window.setTimeout(f, ms));
function mostrarAcao(cen: CenarioV4): void { const el = raiz?.querySelector<HTMLElement>('[data-ab4-acao]'); if (el) el.innerHTML = acao(cen); }

/** O destino pedido (deep link), se for um ecrã que existe; senão, o Início. */
function destino(): string {
  const p = new URLSearchParams(location.hash.slice(1)).get('para');
  return p && document.querySelector(`.ecra[data-ecra="${CSS.escape(p)}"]`) ? p : 'inicio';
}

/* ---------- a passagem: o mecanismo recua e a marca voa para a da barra do Início ---------- */
type DocVT = Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } };
function passar(): void {
  if (!raiz) return;
  const ab = raiz, para = destino();
  ab.classList.add('is-e'); mostrarAcao('redirecionar');
  const marca = ab.querySelector<HTMLElement>('.ab4__marca')!;
  const ir = () => {
    marca.style.viewTransitionName = '';
    limpar(); raiz = null;
    mostrar(para);
    const alvo = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .ws-marca');
    if (alvo) { alvo.style.viewTransitionName = 'erp-marca'; window.setTimeout(() => { alvo.style.viewTransitionName = ''; }, 900); }
  };
  const d = document as DocVT;
  if (!d.startViewTransition || quieto()) { window.setTimeout(ir, 150); return; }
  window.setTimeout(() => { marca.style.viewTransitionName = 'erp-marca'; d.startViewTransition!(ir); }, 220);
}

/** O que vem depois da montagem: decide a sessão e a rede, não a animação. */
function seguir(): void {
  if (!raiz) return;
  raiz.classList.add('is-fim');
  if (!navigator.onLine) { mostrarAcao('offline'); return; }
  if (!comSessao()) { mostrarAcao('sem-sessao'); return; }
  mostrarAcao('autenticado');
  if (prototipo() && !editando()) depois(200, passar);
}

/* ---------- a sequência ---------- */
const FASES = ['is-a', 'is-b', 'is-c', 'is-d'];
function correr(): void {
  if (!raiz) return;
  limpar();
  const cen = raiz.dataset.ab4Cenario as CenarioV4;
  if (cen && cen !== 'normal') return; // os estados do ecrã ficam como estão
  raiz.classList.remove(...FASES, 'is-fim', 'is-e', 'is-ja');
  /* o botão está pronto desde o início (se não houver sessão), só aparece no fim */
  mostrarAcao(navigator.onLine && !comSessao() ? 'sem-sessao' : '' as CenarioV4);
  void raiz.offsetWidth;
  if (editando() || quieto() || vista()) { raiz.classList.add(...FASES, 'is-ja'); seguir(); return; }
  depois(0, () => raiz?.classList.add('is-a'));
  depois(200, () => raiz?.classList.add('is-b'));
  depois(550, () => raiz?.classList.add('is-c'));
  depois(800, () => raiz?.classList.add('is-d'));
  depois(1000, () => { marcarVista(); seguir(); });
}
function acabar(): void {
  if (!raiz || raiz.classList.contains('is-fim')) return;
  limpar(); marcarVista();
  raiz.classList.add(...FASES, 'is-ja');
  seguir();
}

function armar(): void {
  const r = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .ab4');
  if (r === raiz) return;
  limpar(); raiz = r;
  if (r) requestAnimationFrame(correr);
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  /* os botões que levavam ao Entrar do ERP (a sessão que terminou) têm data-login: o login é o comum */
  window.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element;
    if (t.closest?.('[data-login], [data-ab4-login]')) { ev.preventDefault(); ev.stopImmediatePropagation(); irIdentidade(); return; }
    if (!raiz || !raiz.contains(t)) return;
    if (t.closest('[data-ab4-aplicacoes]')) { ev.preventDefault(); irIdentidade('aplicacoes'); return; }
    if (t.closest('[data-ab4-repetir]')) { ev.preventDefault(); mostrarAcao('verificar'); depois(700, seguir); return; }
    acabar();
  }, true);
  document.addEventListener('keydown', (ev) => { if (raiz && !editando() && ev.key === 'Escape') acabar(); });
  window.addEventListener('online', () => { if (raiz?.classList.contains('is-fim') && raiz.dataset.ab4Cenario === 'normal') seguir(); });
  window.addEventListener('offline', () => { if (raiz?.classList.contains('is-fim')) mostrarAcao('offline'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) acabar(); });
}
