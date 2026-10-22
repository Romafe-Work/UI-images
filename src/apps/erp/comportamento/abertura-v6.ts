/* =========================================================
   ERP — 00 · Abertura v6 «The Enterprise Engine»: o que mexe (22 out. 2026)
   - Como no Peça A Peça: login comum → esta abertura → a página principal, sozinha (no protótipo, #so=ecra).
   - A sequência: is-a 0 ms, is-b 200, is-c 500, is-d 850; aos 1100 ms, a passagem (is-e): a página por baixo entra
     (o menu desliza, a área em cascata) e a marca da abertura desliza (FLIP, Web Animations) até à marca do
     cabeçalho, que só aparece quando ela lá chega. Aos ≈1,6 s mostra-se o 05 · Início (o mesmo desenho; marca-se
     erp:sem-entrada para a página não voltar a entrar). Com deep link (#…&para=compras), segue para lá.
   - Antes de passar: sem rede → «Sem ligação». Não há «sessão terminada» aqui: chega-se depois do login (22 out., ela).
     Uma vez por sessão do navegador; depois, só a passagem (≈0,5 s).
   - «Saltar» e Esc passam logo. No editor fica na marca, parada.
   ========================================================= */
import { mostrar } from '../../../comum/ecras';
import { irIdentidade } from './abertura-v4';
import { estadoV6, type CenarioV6 } from '../abertura-v6';
import { indicador } from './inicio-v3';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const prototipo = () => document.body.classList.contains('so-ecra');
const VISTA = 'erp:abertura6-vista';
const vista = () => { try { return sessionStorage.getItem(VISTA) === '1'; } catch { return false; } };
let pagina: HTMLElement | null = null, ab: HTMLElement | null = null;
let tempos: number[] = [];
const limpar = () => { tempos.forEach((t) => window.clearTimeout(t)); tempos = []; };
const depois = (ms: number, f: () => void) => tempos.push(window.setTimeout(f, ms));
const estado = (c: CenarioV6) => { const el = ab?.querySelector<HTMLElement>('[data-ab6-estado]'); if (el) el.innerHTML = estadoV6(c); };

/** A passagem: a página entra por baixo e a marca desliza para o cabeçalho. */
const aVista = () => !!pagina && pagina.isConnected && !pagina.closest('[hidden]');
function passar(): void {
  /* só passa se a abertura ainda estiver à vista (um temporizador não pode tirar ninguém de outro ecrã) */
  if (!pagina || !ab || !aVista()) return;
  const pg = pagina, camada = ab;
  if (!navigator.onLine) { estado('offline'); return; }
  /* (22 out.) ela: «depois da abertura deve ir para a página inicial e não para o login» — no protótipo não há servidor
     de sessões: chega-se aqui depois do login, por isso segue sempre para o Início («Sessão terminada» fica como estado) */
  if (!prototipo() || editando()) return;
  camada.classList.add('is-e');
  pg.classList.add('is-marca-oculta'); pg.classList.remove('is-abertura');
  const corpo = pg.querySelector<HTMLElement>('.sh-corpo'); corpo?.removeAttribute('aria-hidden'); corpo?.removeAttribute('inert');
  requestAnimationFrame(() => indicador(pg));
  const marca = camada.querySelector<HTMLElement>('.ab6__marca')!, alvo = pg.querySelector<HTMLElement>('.hm-topo .hm-marca')!;
  const fim = () => {
    pg.classList.remove('is-marca-oculta'); camada.hidden = true;
    try { sessionStorage.setItem(VISTA, '1'); sessionStorage.setItem('erp:sem-entrada', '1'); } catch { /* */ }
    const para = new URLSearchParams(location.hash.slice(1)).get('para');
    limpar(); pagina = null; ab = null;
    mostrar(para && document.querySelector(`.ecra[data-ecra="${CSS.escape(para)}"]`) ? para : 'inicio');
  };
  if (quieto() || !marca.animate) { fim(); return; }
  const o = marca.getBoundingClientRect(), a = alvo.getBoundingClientRect(), natural = marca.offsetWidth || 1;
  const s0 = o.width / natural, s1 = a.width / natural;
  const dx = (a.left + a.width / 2) - (o.left + o.width / 2), dy = (a.top + a.height / 2) - (o.top + o.height / 2);
  const anim = marca.animate([{ transform: `translate(0, 0) scale(${s0})` }, { transform: `translate(${dx}px, ${dy}px) scale(${s1})` }], { duration: 520, easing: 'cubic-bezier(.65, 0, .25, 1)', fill: 'forwards' });
  anim.onfinish = fim;
}

function correr(): void {
  if (!ab || !pagina) return;
  limpar();
  const cen = ab.dataset.ab6Cenario as CenarioV6;
  if (cen && cen !== 'normal') return; // os estados do ecrã ficam parados
  const FASES = ['is-a', 'is-b', 'is-c', 'is-d'];
  ab.classList.remove(...FASES, 'is-e', 'is-ja'); ab.hidden = false; pagina.classList.add('is-abertura'); void ab.offsetWidth;
  if (editando()) { ab.classList.add(...FASES, 'is-ja'); return; }
  if (quieto() || vista()) { ab.classList.add(...FASES, 'is-ja'); depois(350, passar); return; }
  depois(0, () => ab?.classList.add('is-a'));
  depois(200, () => ab?.classList.add('is-b'));
  depois(500, () => ab?.classList.add('is-c'));
  depois(850, () => ab?.classList.add('is-d'));
  depois(1100, passar);
}
function saltar(): void {
  if (!ab || ab.classList.contains('is-e')) return;
  limpar(); ab.classList.add('is-a', 'is-b', 'is-c', 'is-d', 'is-ja'); depois(120, passar);
}
function armar(): void {
  const p = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-sh-abertura]');
  if (p === pagina) return;
  limpar(); pagina = p; ab = p?.querySelector<HTMLElement>('[data-ab6]') ?? null;
  if (p) requestAnimationFrame(correr);
}
export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => { pagina = null; requestAnimationFrame(armar); }));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  document.addEventListener('click', (ev) => {
    if (!ab || editando()) return;
    const t = ev.target as Element; if (!ab.contains(t)) return;
    if (t.closest('[data-ab6-saltar]')) { saltar(); return; }
    if (t.closest('[data-ab6-aplicacoes]')) { irIdentidade('aplicacoes'); return; }
    if (t.closest('[data-ab6-inicio]')) { mostrar('inicio'); return; }
    if (t.closest('[data-ab6-repetir]')) { estado('iniciar'); depois(800, passar); }
  }, true);
  document.addEventListener('keydown', (ev) => { if (ab && !editando() && ev.key === 'Escape') saltar(); });
}
