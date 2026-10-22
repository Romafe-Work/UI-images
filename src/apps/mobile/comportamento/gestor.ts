/* =========================================================
   PICK — o Gestor e a abertura: o que mexe (22 out. 2026). Ver gestor.ts.
   - 00 · Abertura (≈1,6 s): is-a 0 ms armazém, is-b 200 o porta-paletes entra, is-c 500 o feixe marca a posição,
     is-d 800 pousa a palete e confirma, is-e 1100 ROMAFE | Pick; aos 1350, a passagem: a página do papel aparece
     por baixo, a caixa voa para o ícone do Inventário e a marca para o cabeçalho; depois mostra-se o ecrã do papel
     (gestor → 60 · Início do Gestor; operador → 40 · Inventário). Só no protótipo (#so=ecra); no editor fica.
     Uma vez por sessão; depois, só a passagem. Tocar ou «Saltar» acaba-a. Sem rede, não passa (a Pick precisa de rede).
   - O papel vem da sessão (no protótipo: pick:papel, por omissão «gestor»); o mesmo módulo abre portas diferentes.
   - 61 · Inventário (Gestor): os filtros por estado mostram as listas.
   - «Entrar outra vez» (data-login) leva ao início de sessão comum, no PDA.
   ========================================================= */
import { mostrar } from '../../../comum/ecras';

const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const prototipo = () => document.body.classList.contains('so-ecra');
const VISTA = 'pick:abertura-vista';
const papel = () => { try { return sessionStorage.getItem('pick:papel') === 'operador' ? 'operador' : 'gestor'; } catch { return 'gestor'; } };
let pg: HTMLElement | null = null, ab: HTMLElement | null = null, tempos: number[] = [];
const limpar = () => { tempos.forEach((t) => window.clearTimeout(t)); tempos = []; };
const depois = (ms: number, f: () => void) => tempos.push(window.setTimeout(f, ms));
const aVista = () => !!pg && pg.isConnected && !pg.closest('[hidden]');

function voar(de: Element | null, para: Element | null, dur: number): Animation | null {
  if (!de || !para || !(de as HTMLElement).animate) return null;
  const a = de.getBoundingClientRect(), b = para.getBoundingClientRect();
  if (!a.width || !b.width) return null;
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2), k = b.width / a.width;
  return (de as HTMLElement).animate([{ transform: 'translate(0, 0) scale(1)' }, { transform: `translate(${dx}px, ${dy}px) scale(${k})` }], { duration: dur, easing: 'cubic-bezier(.65, 0, .25, 1)', fill: 'forwards' });
}
function passar(): void {
  if (!pg || !ab || !aVista() || !prototipo() || editando()) return;
  if (!navigator.onLine) return;
  const p = pg, c = ab;
  c.classList.add('is-passar');
  p.classList.add('is-marca-oculta', 'is-alvo-oculto'); p.classList.remove('is-abertura');
  const corpo = p.querySelector<HTMLElement>('.gp-corpo'); corpo?.removeAttribute('aria-hidden'); corpo?.removeAttribute('inert');
  p.removeAttribute('data-gp-abertura');
  voar(c.querySelector('[data-gpa-caixa] svg'), p.querySelector('[data-gp-alvo]'), 480);
  const an = voar(c.querySelector('[data-gpa-marca]'), p.querySelector('[data-gp-marca]'), 480);
  const fim = () => {
    p.classList.remove('is-marca-oculta', 'is-alvo-oculto'); c.hidden = true;
    try { sessionStorage.setItem(VISTA, '1'); } catch { /* */ }
    limpar(); pg = null; ab = null;
    mostrar(papel() === 'gestor' ? 'gestor-inicio' : 'inv-inicio');
  };
  if (an && !quieto()) an.onfinish = () => window.setTimeout(fim, 60); else fim();
}
function correr(): void {
  if (!ab || !pg) return;
  limpar();
  if (ab.dataset.gpaCenario !== 'normal') return;
  const F = ['is-a', 'is-b', 'is-c', 'is-d', 'is-e'];
  ab.classList.remove(...F, 'is-passar', 'is-ja'); ab.hidden = false; pg.classList.add('is-abertura'); void ab.offsetWidth;
  if (editando()) { ab.classList.add(...F, 'is-ja'); return; }
  let vista = false; try { vista = sessionStorage.getItem(VISTA) === '1'; } catch { /* */ }
  if (quieto() || vista) { ab.classList.add(...F, 'is-ja'); depois(300, passar); return; }
  ([[0, 'is-a'], [200, 'is-b'], [500, 'is-c'], [800, 'is-d'], [1100, 'is-e']] as [number, string][]).forEach(([ms, k]) => depois(ms, () => ab?.classList.add(k)));
  depois(1350, passar);
}
function acabar(): void { if (!ab || ab.classList.contains('is-passar')) return; limpar(); ab.classList.add('is-a', 'is-b', 'is-c', 'is-d', 'is-e', 'is-ja'); depois(100, passar); }
function saudar(r: HTMLElement): void { const h = new Date().getHours(), s = r.querySelector<HTMLElement>('[data-gp-saudacao]'); if (s) s.textContent = h < 13 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite'; }

function armar(): void {
  const r = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-gp]');
  if (r === pg) return;
  limpar(); pg = r; ab = r?.querySelector<HTMLElement>('[data-gpa]') ?? null;
  if (!r) return;
  saudar(r);
  if (ab) requestAnimationFrame(correr);
}
export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  window.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    if (editando()) return;
    if (t.closest?.('[data-gp] [data-login]')) {
      ev.preventDefault(); ev.stopImmediatePropagation();
      const h = new URLSearchParams(location.hash.slice(1)), q = new URLSearchParams(); ['so', 'demo', 'anim'].forEach((k) => { const v = h.get(k); if (v) q.set(k, v); }); q.set('ecra', 'entrada');
      location.href = '../identidade/#' + q.toString(); return;
    }
    if (!pg || !pg.contains(t)) return;
    if (t.closest('[data-gpa-saltar]') || (ab && ab.contains(t))) { acabar(); return; }
    const f = t.closest<HTMLElement>('[data-gp-filtro]');
    if (f) {
      pg.querySelectorAll('[data-gp-filtro]').forEach((b) => b.setAttribute('aria-selected', String(b === f)));
      pg.querySelectorAll<HTMLElement>('[data-gp-lista] > li').forEach((li) => { li.hidden = li.dataset.gpEstado !== f.dataset.gpFiltro; });
      return;
    }
    if (t.closest('[data-gp-repetir]')) { const id = pg.closest<HTMLElement>('.ecra')?.dataset.estadoDe ?? 'gestor-inicio'; mostrar(id); }
  }, true);
  window.addEventListener('online', () => { if (ab && aVista()) passar(); });
}
