/* =========================================================
   ERP — 00 · Abertura v2: o comportamento (19 out. 2026)
   - A sequência são classes em .ab2, a horas certas (is-f1 … is-final); o CSS faz o resto. Não há ciclos
     contínuos: depois do fim, só o rato mexe na estrutura (e só com rato, nunca no toque).
   - Uma vez por sessão (sessionStorage). Já vista, com «reduzir movimento», ou nos estados do ecrã: a
     composição final aparece logo.
   - Interromper: «Saltar introdução», Esc, um clique no fundo, ou qualquer tecla que não seja Tab.
   - A ação vem da sessão do protótipo (sessao.ts), não da animação: está lá desde o primeiro instante.
     Sem sessão: «Entrar no ERP» (01 · Entrar v10). Com sessão: «Abrir espaço de trabalho» (05 · Início),
     e Compras com «Abrir Compras» se o perfil tiver Compras. Sem rede: «Entrar» desliga-se, e volta sozinho.
   - As passagens são View Transitions: a marca voa para a do ecrã seguinte; em «Abrir Compras», o cartão
     do módulo passa a ser o contentor do ERP (a área de trabalho, ao lado da barra lateral).
   ========================================================= */
import { mostrar, mostrarVersao } from '../../../comum/ecras';
import { acao, modulos, type Cenario } from '../abertura-v2';
import { lerSessao, perfilDaSessao } from '../sessao';
import { PERFIS } from '../inicio-dados';
import { VERSAO_REDE } from '../entrar-rede';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const VISTA = 'erp:abertura2-vista';
const vista = () => { try { return sessionStorage.getItem(VISTA) === '1'; } catch { return false; } };
const marcarVista = () => { try { sessionStorage.setItem(VISTA, '1'); } catch { /* */ } };

let raiz: HTMLElement | null = null;
let tempos: number[] = [];

/** O estado real (no ecrã principal; os estados do ecrã trazem o seu). */
function cenarioReal(r: HTMLElement): Cenario {
  const fixo = r.dataset.ab2Cenario as Cenario;
  if (fixo && fixo !== 'normal') return fixo;
  if (!navigator.onLine) return 'offline';
  if (!lerSessao()) return 'normal';
  return PERFIS[perfilDaSessao()].modulos.includes('compras') ? 'sessao' : 'sem-acesso';
}
function pintarAcao(): void {
  if (!raiz) return;
  const c = cenarioReal(raiz);
  if (raiz.dataset.ab2Cenario === 'normal' || !raiz.dataset.ab2Cenario) {
    raiz.querySelector<HTMLElement>('[data-ab2-accao]')!.innerHTML = acao(c);
    raiz.querySelector<HTMLElement>('[data-ab2-lista]')!.innerHTML = modulos(c);
    const faixa = raiz.querySelector<HTMLElement>('[data-ab2-faixa]')!;
    faixa.innerHTML = c === 'offline' ? '<span>Sem ligação à rede. Para entrar é preciso falar com o servidor.</span>' : '';
  }
  const quem = raiz.querySelector<HTMLElement>('[data-ab2-quem]');
  if (quem && !quem.id) { const p = PERFIS[perfilDaSessao()]; quem.textContent = `Sessão aberta: ${p.pessoa} · ${p.nome}`; }
}
function marcarTema(): void {
  let t = 'auto'; try { t = localStorage.getItem('uiux:tema') || 'auto'; } catch { /* */ }
  raiz?.querySelectorAll<HTMLElement>('.segmented__btn[data-tema]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tema === t)));
}

/* ---------- a escala e o centro do palco: a moldura central fica onde está a marca ---------- */
function medir(): void {
  if (!raiz) return;
  const w = raiz.clientWidth, h = window.innerHeight;
  const k = Math.max(.42, Math.min(w / 1150, h / 820, 1.12));
  const faixa = raiz.querySelector<HTMLElement>('[data-ab2-faixa]')!;
  faixa.style.marginTop = '';
  const m = raiz.querySelector<HTMLElement>('.ab2__marca')!.getBoundingClientRect(), r0 = raiz.getBoundingClientRect();
  const t = raiz.querySelector<HTMLElement>('.ab2__sub')!.getBoundingClientRect();
  const cy = (m.top + t.bottom) / 2 - r0.top;
  raiz.style.setProperty('--k', k.toFixed(3));
  raiz.style.setProperty('--cy', `${Math.round(cy)}px`);
  /* a ação fica por baixo da fila de baixo da estrutura (y 504 no plano; o centro do plano é y 310): assim
     nada se sobrepõe no fim, e a ação já está no sítio dela desde o início (não salta) */
  const fundo = cy + (504 - 310) * k + 22, f = faixa.getBoundingClientRect().top - r0.top;
  if (w >= 700 && fundo > f) faixa.style.marginTop = `${Math.round(18 + fundo - f)}px`;
}

/* ---------- a sequência ---------- */
const FASES = ['is-f1', 'is-f2', 'is-f3', 'is-f4', 'is-final'];
function limpar(): void { tempos.forEach((t) => window.clearTimeout(t)); tempos = []; }
function fim(ja = true): void {
  if (!raiz) return;
  limpar();
  if (ja) raiz.classList.add('is-ja');
  raiz.classList.add(...FASES);
  marcarVista();
}
function correr(): void {
  if (!raiz) return;
  limpar();
  raiz.classList.remove(...FASES, 'is-ja', 'is-a-abrir');
  void raiz.offsetWidth;
  if (quieto() || vista() || (raiz.dataset.ab2Cenario && raiz.dataset.ab2Cenario !== 'normal') || editando()) { fim(); return; }
  [[60, 'is-f1'], [480, 'is-f2'], [1550, 'is-f3'], [2350, 'is-f4'], [2950, 'is-final']].forEach(([ms, c]) => tempos.push(window.setTimeout(() => raiz?.classList.add(c as string), ms as number)));
  tempos.push(window.setTimeout(() => { marcarVista(); raiz?.classList.remove('is-ja'); }, 3000));
}

/* ---------- as passagens ---------- */
type DocVT = Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } };
function passar(destino: 'entrada' | 'inicio' | 'compras', origem?: HTMLElement): void {
  if (!raiz) return;
  const ab = raiz;
  const marca = ab.querySelector<HTMLElement>('.ab2__marca')!;
  const ir = () => {
    marca.style.viewTransitionName = ''; if (origem) origem.style.viewTransitionName = '';
    limpar(); raiz = null;
    mostrar(destino);
    if (destino === 'entrada') mostrarVersao(VERSAO_REDE);
    if (destino === 'compras') mostrarVersao('v2');
    const ecra = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden])');
    const alvos: [HTMLElement | null | undefined, string][] = [[ecra?.querySelector<HTMLElement>(destino === 'entrada' ? '.rede__marca' : '.ws-marca'), 'erp-marca']];
    if (origem) alvos.push([ecra?.querySelector<HTMLElement>('.ws-principal'), 'erp-modulo']);
    alvos.forEach(([el, n]) => { if (el) { el.style.viewTransitionName = n; window.setTimeout(() => { el.style.viewTransitionName = ''; }, 900); } });
  };
  const d = document as DocVT;
  if (!d.startViewTransition || quieto()) { ir(); return; }
  marca.style.viewTransitionName = 'erp-marca';
  if (origem) origem.style.viewTransitionName = 'erp-modulo';
  d.startViewTransition(ir);
}
function abrirModulo(b: HTMLElement): void {
  if (!raiz) return;
  fim();
  const cartao = b.closest<HTMLElement>('.ab2__mod')!;
  cartao.classList.add('is-escolhido'); raiz.classList.add('is-a-abrir');
  /* o foco no módulo, o resto recua (200 ms); depois o cartão passa a ser o contentor do ERP */
  window.setTimeout(() => passar('compras', cartao), quieto() ? 0 : 200);
}

/* ---------- ligar ---------- */
function armar(): void {
  const r = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .ab2');
  if (r === raiz) return;
  limpar();
  raiz = r;
  if (!r) return;
  pintarAcao(); marcarTema();
  requestAnimationFrame(() => { medir(); correr(); });
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  window.addEventListener('resize', () => medir());
  document.addEventListener('click', (ev) => {
    if (!raiz || editando()) return;
    const alvo = ev.target as Element; if (!raiz.contains(alvo)) return;
    const b = alvo.closest<HTMLElement>('[data-ab2-ir], [data-ab2-saltar], [data-ab2-repetir], .segmented__btn');
    if (!b) { if (!raiz.classList.contains('is-final')) fim(); return; }
    if (b.matches('.segmented__btn')) { requestAnimationFrame(marcarTema); return; }
    ev.preventDefault(); ev.stopPropagation();
    if (b.matches('[data-ab2-saltar]')) { fim(); raiz.querySelector<HTMLElement>('.ab2__cta')?.focus(); return; }
    if (b.matches('[data-ab2-repetir]')) { location.reload(); return; }
    const d = b.dataset.ab2Ir as 'entrada' | 'inicio' | 'compras';
    if ((b as HTMLButtonElement).disabled) return;
    if (d === 'compras') abrirModulo(b); else passar(d);
  }, true);
  document.addEventListener('keydown', (ev) => {
    if (!raiz || editando() || raiz.classList.contains('is-final')) return;
    if (ev.key === 'Tab' || ev.key === 'Shift') return;
    fim();
  });
  /* depois do fim, a estrutura segue o rato devagar; no toque não */
  window.addEventListener('pointermove', (ev) => {
    if (!raiz || ev.pointerType !== 'mouse' || !raiz.classList.contains('is-final')) return;
    raiz.style.setProperty('--px', ((ev.clientX / innerWidth) * 2 - 1).toFixed(3));
    raiz.style.setProperty('--py', ((ev.clientY / innerHeight) * 2 - 1).toFixed(3));
  }, { passive: true });
  window.addEventListener('online', pintarAcao);
  window.addEventListener('offline', pintarAcao);
  document.addEventListener('visibilitychange', () => { if (document.hidden && raiz && !raiz.classList.contains('is-final')) fim(); });
}
