/* =========================================================
   ERP — 05 · Início v2: o que mexe (22 out. 2026)
   - A saudação e a data são as de agora (Bom dia / Boa tarde / Boa noite); os números contam de 0 até ao valor
     (≈600 ms, uma vez por entrada no ecrã; com «reduzir movimento», já no valor).
   - Os números, Compras e as linhas de «Requer atenção» abrem Compras; os outros módulos dizem «em breve».
   - O sino abre e fecha os avisos (Esc ou clicar fora fecham); Ctrl+K põe o foco na procura.
   ========================================================= */
import { mostrar } from '../../../comum/ecras';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* no editor, com «Interagir» ligado (26 out.), o ecrã responde como no protótipo */
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
let raiz: HTMLElement | null = null;
let aviso = 0;

function saudar(r: HTMLElement): void {
  const agora = new Date(), h = agora.getHours();
  const s = r.querySelector<HTMLElement>('[data-hm-saudacao]'); if (s) s.textContent = h < 13 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite';
  const d = r.querySelector<HTMLElement>('[data-hm-data]'); if (d) d.textContent = agora.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
}
function contar(r: HTMLElement): void {
  if (r.dataset.hmCenario === 'carregar') return;
  r.querySelectorAll<HTMLElement>('[data-hm-contar]').forEach((el) => {
    const fim = Number(el.dataset.hmContar) || 0;
    if (quieto() || editando() || fim === 0) { el.textContent = String(fim); return; }
    const t0 = performance.now(), dur = 600;
    const passo = (t: number) => { const k = Math.min(1, (t - t0) / dur), e = 1 - (1 - k) ** 3; el.textContent = String(Math.round(fim * e)); if (k < 1) requestAnimationFrame(passo); };
    el.textContent = '0'; requestAnimationFrame(passo);
  });
}
function dizer(t: string): void {
  const el = raiz?.querySelector<HTMLElement>('[data-hm-aviso]'); if (!el) return;
  el.textContent = t; el.classList.add('is-visivel');
  window.clearTimeout(aviso); aviso = window.setTimeout(() => el.classList.remove('is-visivel'), 2200);
}
function avisos(abrir?: boolean): void {
  if (!raiz) return;
  const p = raiz.querySelector<HTMLElement>('[data-hm-avisos-painel]'), b = raiz.querySelector<HTMLElement>('[data-hm-avisos]');
  if (!p || !b) return; /* o Início v6 não tem avisos */
  const vai = abrir ?? p.hidden; p.hidden = !vai; b.setAttribute('aria-expanded', String(vai));
}
function armar(): void {
  const r = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-hm]');
  if (r === raiz) return;
  raiz = r;
  if (r) { saudar(r); contar(r); }
}
export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  document.addEventListener('click', (ev) => {
    if (!raiz || editando()) return;
    const t = ev.target as Element; if (!raiz.contains(t)) return;
    const b = t.closest<HTMLElement>('[data-hm-ir], [data-hm-breve], [data-hm-avisos], [data-hm-dica]');
    if (!b) { if (!t.closest('[data-hm-avisos-painel]')) avisos(false); return; }
    ev.preventDefault();
    if (b.matches('[data-hm-avisos]')) { avisos(); return; }
    avisos(false);
    if (b.matches('[data-hm-breve]')) { dizer(`${b.dataset.hmBreve}: em desenvolvimento. O primeiro módulo é Compras.`); return; }
    if (b.matches('[data-hm-dica]')) { dizer(`${b.dataset.hmDica}: ainda sem ecrã no protótipo.`); return; }
    const para = b.dataset.hmIr!; if (para !== 'inicio') mostrar(para);
  }, true);
  document.addEventListener('keydown', (ev) => {
    if (!raiz) return;
    if (ev.key === 'Escape') avisos(false);
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); raiz.querySelector<HTMLInputElement>('.hm-procura input')?.focus(); }
  });
}
