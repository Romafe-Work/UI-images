/* =========================================================
   PEÇA A PEÇA — a barra de filtros dos documentos: os menus e o painel (21 out. 2026)
   Os botões de cada dimensão continuam a filtrar como antes (o comportamento de cada ecrã); aqui só:
   - abrir e fechar os menus (clique, Enter/espaço, setas, Escape, clique fora), um de cada vez;
   - escrever no botão o valor escolhido («Estado: Expedido») e marcá-lo quando não é «Todos» — também quando
     o filtro muda por outra via (a etiqueta ×, «Limpar tudo»): segue o aria-pressed;
   - o painel «Filtrar…»: Escape e clique fora fecham-no e o foco volta ao botão «Filtros».
   ========================================================= */
const $$ = <T extends HTMLElement = HTMLElement>(r: ParentNode, s: string) => Array.from(r.querySelectorAll<T>(s));
const OPCAO = '.ped4__est, .ped4__etapa-f';

function rotular(fb: HTMLElement): void {
  $$(fb, '[data-fb-menu]').forEach((m) => {
    const b = m.querySelector<HTMLElement>(`:is(${OPCAO})[aria-pressed="true"]`); if (!b) return;
    const c = b.cloneNode(true) as HTMLElement; c.querySelectorAll('.ped4__est-n, svg').forEach((x) => x.remove());
    const v = c.textContent!.trim(), todos = /^tod[oa]s$/i.test(v);
    m.querySelector('[data-fb-valor]')!.textContent = todos ? 'Todos' : v;
    m.classList.toggle('is-ativo', !todos);
  });
}
function fecharMenus(excepto?: HTMLElement | null, focar = false): void {
  $$(document, '[data-fb-menu].is-aberto').forEach((m) => {
    if (m === excepto) return;
    m.classList.remove('is-aberto'); m.querySelector<HTMLElement>('.fb-menu__lista')!.hidden = true;
    const b = m.querySelector<HTMLElement>('.fb-menu__btn')!; b.setAttribute('aria-expanded', 'false'); if (focar) b.focus();
  });
}
function abrirMenu(m: HTMLElement): void {
  fecharMenus(m);
  const l = m.querySelector<HTMLElement>('.fb-menu__lista')!, abrir = l.hidden;
  if (!abrir) { fecharMenus(null, true); return; }
  l.hidden = false; m.classList.add('is-aberto'); m.querySelector('.fb-menu__btn')!.setAttribute('aria-expanded', 'true');
  (l.querySelector<HTMLElement>(`:is(${OPCAO})[aria-pressed="true"]`) ?? l.querySelector<HTMLElement>(OPCAO))?.focus();
}
function fecharPainel(main: HTMLElement, focar = true): void {
  const t = main.querySelector<HTMLElement>('.fb .ped4__filtros-abrir'); if (!t || !main.classList.contains('filtros-abertos')) return;
  t.click(); if (focar) t.focus();
}
const ligados = new WeakSet<HTMLElement>();
function armar(): void {
  $$(document, '.ecra:not([hidden]) > .versao:not([hidden]) .fb').forEach((fb) => {
    rotular(fb);
    if (ligados.has(fb)) return; ligados.add(fb);
    new MutationObserver(() => rotular(fb)).observe(fb, { attributes: true, attributeFilter: ['aria-pressed'], subtree: true });
  });
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  document.addEventListener('click', (ev) => {
    const t = ev.target as Element;
    const btn = t.closest?.<HTMLElement>('.fb-menu__btn'); if (btn) { abrirMenu(btn.closest<HTMLElement>('[data-fb-menu]')!); return; }
    /* uma opção: o ecrã filtra (o seu ouvinte); o menu fecha e o botão diz o novo valor */
    const op = t.closest?.<HTMLElement>(`.fb-menu__lista :is(${OPCAO})`);
    if (op) { const m = op.closest<HTMLElement>('[data-fb-menu]')!; requestAnimationFrame(() => { rotular(m.closest<HTMLElement>('.fb')!); fecharMenus(null, true); }); return; }
    if (!t.closest?.('[data-fb-menu]')) fecharMenus();
    /* o painel fecha com um clique fora dele (que não seja no próprio «Filtros») */
    const main = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .ped4.filtros-abertos');
    if (main && !t.closest?.('.fb__painel, .ped4__filtros-abrir') && t.isConnected) fecharPainel(main, false);
  });
  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement;
    const lista = t.closest?.<HTMLElement>('.fb-menu__lista');
    if (lista && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) {
      ev.preventDefault(); const ops = $$(lista, OPCAO), i = ops.indexOf(t);
      ops[(i + (ev.key === 'ArrowDown' ? 1 : -1) + ops.length) % ops.length]?.focus(); return;
    }
    if (ev.key !== 'Escape') return;
    if (t.closest?.('[data-fb-menu]') && document.querySelector('[data-fb-menu].is-aberto')) { ev.preventDefault(); fecharMenus(null, true); return; }
    const main = t.closest?.<HTMLElement>('.ped4.filtros-abertos'); if (main && t.closest('.fb__painel, .ped4__filtros-abrir')) { ev.preventDefault(); fecharPainel(main); }
  });
}
