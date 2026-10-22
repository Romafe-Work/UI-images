/* =========================================================
   ERP — 00 · Abertura v5: o comportamento (22 out. 2026)
   - «Sistema a ativar»: classes em .ab5 (is-a 0 ms, is-b 250, is-c 600, is-ativo 1200) e, aos 2,6 s, segue sozinho
     para o Início, como a abertura do Peça A Peça (no protótipo e com sessão). Uma vez por sessão do
     navegador; depois, ou com «reduzir movimento», ou no editor, tudo no sítio logo. Interativo desde o início.
   - «Entrar no ERP»: com sessão (a da ROMAFE Identity ou a do ERP), o botão passa a «A abrir…» e o Início (ou o
     destino pedido) abre com a marca a passar à da barra; sem sessão, o login comum. «Abrir» no painel dos
     módulos leva a Compras.
   - «Ver módulos» e «Ajuda» abrem um painel pequeno (Esc ou clicar fora fecham; o foco volta ao botão).
   - Os números de Compras são os do protótipo (compras/dominio.ts): relidos ao entrar no ecrã.
   ========================================================= */
import { mostrar } from '../../../comum/ecras';
import { lerSessao } from '../sessao';
import { irIdentidade } from './abertura-v4';
import { FORNECEDORES, encomendas } from '../compras/dominio';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const VISTA = 'erp:abertura5-vista';
const vista = () => { try { return sessionStorage.getItem(VISTA) === '1'; } catch { return false; } };
const marcarVista = () => { try { sessionStorage.setItem(VISTA, '1'); } catch { /* */ } };
const comSessao = () => { try { if (sessionStorage.getItem('romafe:sessao')) return true; } catch { /* */ } return !!lerSessao(); };

let raiz: HTMLElement | null = null;
let tempos: number[] = [];
let aberto: HTMLElement | null = null;
function limpar(): void { tempos.forEach((t) => window.clearTimeout(t)); tempos = []; }
const depois = (ms: number, f: () => void) => tempos.push(window.setTimeout(f, ms));

function numeros(): void {
  if (!raiz) return;
  try {
    const l = encomendas();
    const n = { aprovar: l.filter((e) => e.estado === 'A aprovar').length, forn: FORNECEDORES.filter((f) => f.ativo).length, curso: l.filter((e) => e.estado === 'Aprovada' || e.estado === 'Emitida' || e.estado === 'Parcialmente recebida').length };
    (Object.keys(n) as (keyof typeof n)[]).forEach((k) => { const el = raiz!.querySelector<HTMLElement>(`[data-ab5-n="${k}"]`); if (el) el.textContent = String(n[k]); });
  } catch { /* ficam os do HTML */ }
}

/* ---------- a entrada: «A abrir…» e a marca a passar à da barra do Início ---------- */
type DocVT = Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } };
function entrar(b: HTMLElement): void {
  if (!raiz) return;
  if (!comSessao()) { irIdentidade(); return; }
  const para = b.dataset.para || new URLSearchParams(location.hash.slice(1)).get('para') || 'inicio';
  const cta = raiz.querySelector<HTMLButtonElement>('.ab5__cta')!;
  cta.disabled = true; cta.setAttribute('aria-busy', 'true'); cta.classList.add('is-a-entrar');
  cta.innerHTML = '<span class="ab5__girador" aria-hidden="true"></span><span class="btn__rotulo">A abrir…</span>';
  const marca = raiz.querySelector<HTMLElement>('.ab5__marca')!;
  const ir = () => {
    marca.style.viewTransitionName = '';
    limpar(); raiz = null;
    mostrar(document.querySelector(`.ecra[data-ecra="${CSS.escape(para)}"]`) ? para : 'inicio');
    const alvo = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .ws-marca');
    if (alvo) { alvo.style.viewTransitionName = 'erp-marca'; window.setTimeout(() => { alvo.style.viewTransitionName = ''; }, 900); }
  };
  const d = document as DocVT;
  window.setTimeout(() => {
    if (!d.startViewTransition || quieto()) { ir(); return; }
    marca.style.viewTransitionName = 'erp-marca'; d.startViewTransition(ir);
  }, 450);
}

/* ---------- os painéis ---------- */
function fecharPainel(): void {
  if (!aberto || !raiz) return;
  const qual = aberto.dataset.ab5Qual;
  aberto.hidden = true; aberto = null;
  const b = raiz.querySelector<HTMLElement>(`[data-ab5-painel="${qual}"]`); b?.setAttribute('aria-expanded', 'false'); b?.focus();
}
function abrirPainel(qual: string): void {
  if (!raiz) return;
  const era = aberto?.dataset.ab5Qual; fecharPainel();
  if (era === qual) return;
  const p = raiz.querySelector<HTMLElement>(`[data-ab5-qual="${qual}"]`); if (!p) return;
  p.hidden = false; aberto = p;
  raiz.querySelector(`[data-ab5-painel="${qual}"]`)?.setAttribute('aria-expanded', 'true');
  p.querySelector<HTMLElement>('button')?.focus();
}

/* ---------- a sequência ---------- */
const FASES = ['is-a', 'is-b', 'is-c', 'is-ativo'];
function correr(): void {
  if (!raiz) return;
  limpar(); numeros();
  const cen = raiz.dataset.ab5Cenario;
  if (cen && cen !== 'normal') { raiz.classList.add('is-ja'); return; }
  raiz.classList.remove(...FASES, 'is-ja');
  void raiz.offsetWidth;
  if (editando()) { raiz.classList.add(...FASES, 'is-ja'); return; }
  if (quieto() || vista()) { raiz.classList.add(...FASES, 'is-ja'); depois(700, seguir); return; }
  depois(0, () => raiz?.classList.add('is-a'));
  depois(250, () => raiz?.classList.add('is-b'));
  depois(600, () => raiz?.classList.add('is-c'));
  depois(1200, () => { raiz?.classList.add('is-ativo'); marcarVista(); });
  depois(2600, seguir);
}
/** (22 out.) ela: «como no Peça A Peça: depois do login aparece a abertura e depois a página principal do ERP» —
    depois de ativo, segue sozinho para o Início (só no protótipo, #so=ecra; no editor fica). Sem sessão, fica
    («Entrar no ERP» leva ao login comum). */
function seguir(): void {
  if (!raiz || editando() || !document.body.classList.contains('so-ecra') || !comSessao() || aberto) return;
  const b = raiz.querySelector<HTMLElement>('.ab5__cta[data-ab5-entrar]'); if (b) entrar(b);
}

function armar(): void {
  const r = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .ab5');
  if (r === raiz) return;
  limpar(); aberto = null; raiz = r;
  if (r) requestAnimationFrame(correr);
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  document.addEventListener('click', (ev) => {
    if (!raiz || editando()) return;
    const t = ev.target as Element; if (!raiz.contains(t)) return;
    const b = t.closest<HTMLElement>('[data-ab5-entrar], [data-ab5-painel], [data-ab5-fechar], [data-ab5-repetir]');
    if (!b) { if (aberto && !aberto.contains(t)) fecharPainel(); return; }
    ev.preventDefault(); ev.stopPropagation();
    if (b.matches('[data-ab5-entrar]')) { if (!(b as HTMLButtonElement).disabled) entrar(b); }
    else if (b.matches('[data-ab5-painel]')) abrirPainel(b.dataset.ab5Painel!);
    else if (b.matches('[data-ab5-fechar]')) fecharPainel();
    else { b.setAttribute('aria-busy', 'true'); window.setTimeout(() => location.reload(), 300); }
  }, true);
  document.addEventListener('keydown', (ev) => { if (raiz && ev.key === 'Escape' && aberto) { ev.preventDefault(); fecharPainel(); } });
}
