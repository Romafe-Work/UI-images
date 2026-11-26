/* =========================================================
   PEÇA A PEÇA — comportamento do histórico de documentos (26 nov. 2026)
   Pedidos v6, Guias v4, Faturas v3 e Devoluções v2 (portal/historico.ts). Os mesmos filtros servem as duas
   vistas (a cronologia e a tabela): pesquisa, período, as listas de cada ecrã; as etiquetas dos filtros ativos
   tiram-se uma a uma; a contagem e os meses acompanham. A vista escolhida fica guardada por ecrã. Os meses
   recolhem-se. A tabela ordena-se pelas colunas com botão. Um registo abre o painel de detalhe (um <dialog>
   modal: prende o foco, Esc fecha, o foco volta a quem o abriu). As ligações do painel abrem o outro ecrã já
   nesse documento (as chaves de sessionStorage de sempre: goparts:abrir-pedido, -guia, -fatura).
   ========================================================= */
import { mostrar } from '../../../comum/ecras';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $$ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => Array.from(r.querySelectorAll<T>(s));
const ler = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const gravar = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };

function portalDe(el: Element): HTMLElement | null { return el.closest<HTMLElement>('.portal--hx'); }
const plural = (main: HTMLElement, n: number) => { const p = main.closest('.portal--hx')!; return `${n} ${n === 1 ? p.getAttribute('data-hx-um') ?? '' : p.getAttribute('data-hx-varios') ?? ''}`.trim(); };

/* ---------- filtrar ---------- */
function filtrar(main: HTMLElement): void {
  const f = main.querySelector<HTMLFormElement>('[data-hx-filtros]')!;
  const q = f.querySelector<HTMLInputElement>('[data-hx-procura]')!.value.trim().toLowerCase();
  const de = f.querySelector<HTMLInputElement>('[data-hx-de]')!.value, ate = f.querySelector<HTMLInputElement>('[data-hx-ate]')!.value;
  const sels = $$<HTMLSelectElement>(f, 'select[data-hx-filtro]').filter((s) => s.value);
  const passa = (el: HTMLElement) => (!q || (el.dataset.procura ?? '').includes(q))
    && (!de || (el.dataset.data ?? '') >= de) && (!ate || (el.dataset.data ?? '') <= ate)
    && sels.every((s) => (el.getAttribute(`data-f-${s.dataset.hxFiltro}`) ?? '').split(' ').includes(s.value));
  let n = 0;
  $$(main, '.hx__item').forEach((li) => { const v = passa(li); li.hidden = !v; if (v) n++; });
  $$(main, '.hx__linha').forEach((tr) => { tr.hidden = !passa(tr); });
  /* os meses e os anos sem nada desaparecem; a contagem do mês acompanha */
  $$(main, '.hx__mes').forEach((m) => { const k = $$(m, '.hx__item:not([hidden])').length; m.hidden = !k; const c = m.querySelector('[data-hx-mes-n]'); if (c) c.textContent = c.textContent!.replace(/^\d+/, String(k)); });
  $$(main, '.hx__ano').forEach((a) => { let s = a.nextElementSibling, algum = false; while (s && !s.classList.contains('hx__ano')) { if (!(s as HTMLElement).hidden) algum = true; s = s.nextElementSibling; } (a as HTMLElement).hidden = !algum; });
  const total = $$(main, '.hx__item').length;
  main.querySelector('[data-hx-conta]')!.innerHTML = n === total ? plural(main, total) : `<b>${n}</b> de ${plural(main, total)}`;
  const vazio = main.querySelector<HTMLElement>('[data-hx-vazio]')!; vazio.hidden = n > 0;
  main.querySelector<HTMLElement>('[data-hx-crono]')!.classList.toggle('is-vazio', !n);
  main.querySelector<HTMLElement>('[data-hx-tabela]')!.classList.toggle('is-vazio', !n);
  chips(main, q, de, ate, sels);
}
function chips(main: HTMLElement, q: string, de: string, ate: string, sels: HTMLSelectElement[]): void {
  const c: [string, string][] = [];
  if (q) c.push(['procura', `«${q}»`]);
  const pt = (d: string) => d.split('-').reverse().join('/');
  if (de || ate) c.push(['periodo', de && ate ? `${pt(de)} – ${pt(ate)}` : de ? `desde ${pt(de)}` : `até ${pt(ate)}`]);
  sels.forEach((s) => c.push([`f:${s.dataset.hxFiltro}`, `${s.getAttribute('aria-label')}: ${s.selectedOptions[0].textContent}`]));
  main.querySelector('[data-hx-chips]')!.innerHTML = c.map(([k, t]) => `<li><span>${t}</span><button type="button" data-hx-tirar="${k}" aria-label="Tirar o filtro ${t.replace(/"/g, '')}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></li>`).join('');
  $$(main, '.hx__ativos [data-hx-limpar]').forEach((b) => { b.hidden = !c.length; });
}
function tirar(main: HTMLElement, k: string): void {
  const f = main.querySelector<HTMLFormElement>('[data-hx-filtros]')!;
  if (k === 'procura') f.querySelector<HTMLInputElement>('[data-hx-procura]')!.value = '';
  else if (k === 'periodo') { f.querySelector<HTMLInputElement>('[data-hx-de]')!.value = ''; f.querySelector<HTMLInputElement>('[data-hx-ate]')!.value = ''; }
  else { const s = f.querySelector<HTMLSelectElement>(`select[data-hx-filtro="${k.slice(2)}"]`); if (s) s.value = ''; }
  filtrar(main);
}
function limpar(main: HTMLElement): void {
  const f = main.querySelector<HTMLFormElement>('[data-hx-filtros]')!; f.reset(); filtrar(main);
  f.querySelector<HTMLInputElement>('[data-hx-procura]')!.focus();
}

/* ---------- vistas ---------- */
function vista(main: HTMLElement, v: string, guardar = true): void {
  $$(main, '[data-hx-vista]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.hxVista === v)));
  main.querySelector<HTMLElement>('[data-hx-crono]')!.hidden = v !== 'crono';
  main.querySelector<HTMLElement>('[data-hx-tabela]')!.hidden = v !== 'tabela';
  if (guardar) gravar(`goparts:hx:${main.dataset.hx}:vista`, v);
}

/* ---------- ordenar a tabela ---------- */
function ordenar(main: HTMLElement, b: HTMLElement): void {
  const th = b.closest('th')!, i = b.dataset.hxOrdenar!, antes = th.getAttribute('aria-sort');
  const dir = antes === 'descending' ? 'ascending' : 'descending';
  $$(main, '.hx__tabela th[aria-sort]').forEach((x) => x.setAttribute('aria-sort', 'none'));
  th.setAttribute('aria-sort', dir);
  const tbody = main.querySelector('.hx__tabela tbody')!, ls = $$(tbody, 'tr');
  const val = (tr: HTMLElement) => tr.getAttribute(`data-o${i}`) ?? '';
  ls.sort((a, c) => { const x = val(a), y = val(c), nx = Number(x), ny = Number(y); const r = !Number.isNaN(nx) && !Number.isNaN(ny) && x !== '' && y !== '' ? nx - ny : x.localeCompare(y, 'pt'); return dir === 'ascending' ? r : -r; });
  ls.forEach((tr) => tbody.append(tr));
  const a = portalDe(main)?.querySelector<HTMLElement>('[data-hx-aviso]'); if (a) a.textContent = `Ordenado por ${b.textContent?.trim()}, ${dir === 'ascending' ? 'crescente' : 'decrescente'}.`;
}

/* ---------- o painel de detalhe ---------- */
let origem: HTMLElement | null = null;
function abrir(portal: HTMLElement, id: string, de?: HTMLElement | null): void {
  const t = portal.querySelector<HTMLTemplateElement>(`template[data-hx-detalhe="${CSS.escape(id)}"]`); if (!t) return;
  const g = portal.querySelector<HTMLDialogElement>('[data-hx-gaveta]')!;
  g.querySelector('.hx__gaveta-t')!.textContent = id;
  const corpo = g.querySelector<HTMLElement>('[data-hx-corpo]')!; corpo.replaceChildren(t.content.cloneNode(true)); corpo.scrollTop = 0;
  $$(portal, '.hx__item.is-aberto, .hx__linha.is-aberto').forEach((x) => x.classList.remove('is-aberto'));
  $$(portal, `[data-hx-reg="${CSS.escape(id)}"]`).forEach((x) => x.classList.add('is-aberto'));
  origem = de ?? (document.activeElement as HTMLElement | null);
  if (!g.open) g.showModal();
  g.querySelector<HTMLElement>('[data-hx-fechar]')!.focus();
  portal.dispatchEvent(new CustomEvent('hx:aberto', { detail: id, bubbles: true }));
}
function fechar(g: HTMLDialogElement): void {
  const fim = () => { g.close(); g.classList.remove('is-a-sair'); if (origem?.isConnected) origem.focus({ preventScroll: true }); };
  if (quieto()) { fim(); return; }
  g.classList.add('is-a-sair'); window.setTimeout(fim, 160);
}

/* ---------- imprimir ou guardar em PDF ----------
   O documento abre numa janela limpa (só o conteúdo, sem botões nem ligações) e a impressão do navegador permite
   «Guardar como PDF». Não há PDF do servidor neste protótipo: não se finge uma descarga. */
function imprimir(g: HTMLDialogElement, id: string): void {
  const c = g.querySelector<HTMLElement>('[data-hx-corpo]')!.cloneNode(true) as HTMLElement;
  c.querySelectorAll('.hx__acoes, button svg').forEach((x) => x.remove());
  c.querySelectorAll('button').forEach((b) => { const s = document.createElement('span'); s.innerHTML = b.innerHTML; b.replaceWith(s); });
  const w = window.open('', '_blank', 'width=820,height=1000');
  const a = g.closest('.portal')?.querySelector<HTMLElement>('[data-hx-aviso]');
  if (!w) { if (a) a.textContent = 'O navegador bloqueou a janela de impressão: permita janelas deste site e tente outra vez.'; return; }
  w.document.write(`<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><title>${id}</title><style>
    body{font:14px/1.45 system-ui,sans-serif;color:#111;margin:32px}h1{font:700 22px ui-monospace,monospace;margin:0 0 4px}.romafe{color:#0063aa;font-weight:800;letter-spacing:.04em}
    h3{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#555;margin:20px 0 8px;border-bottom:1px solid #ccc;padding-bottom:4px}
    dl{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin:0}dt{font-size:11px;color:#666}dd{margin:0}table{width:100%;border-collapse:collapse}
    th,td{padding:5px 6px;border-bottom:1px solid #ddd;text-align:left}.hx__num{text-align:right}svg{display:none}span{display:inline}.hx__docs>span{display:block;padding:2px 0}
    .hx__somas div{display:flex;justify-content:space-between}.is-total{font-weight:700}</style></head><body><p class="romafe">ROMAFE · Peça A Peça</p><h1>${id}</h1>${c.innerHTML}</body></html>`);
  w.document.close(); w.focus(); w.print();
}

/* ---------- ligar ---------- */
const CHEGADA: Record<string, string> = { pedidos: 'goparts:abrir-pedido', guias: 'goparts:abrir-guia', faturas: 'goparts:abrir-fatura', devolucoes: 'goparts:abrir-devolucao' };
function armar(): void {
  $$(document, '.ecra:not([hidden]) > .versao:not([hidden]) .portal--hx main[data-hx]').forEach((main) => {
    if (main.dataset.hxPronto) return; main.dataset.hxPronto = '1';
    const v = ler(`goparts:hx:${main.dataset.hx}:vista`); if (v === 'tabela' || v === 'crono') vista(main, v, false);
    filtrar(main);
    /* veio de outro ecrã para um documento: abre-o */
    const k = CHEGADA[main.dataset.hx!]; let id: string | null = null;
    try { id = sessionStorage.getItem(k); if (id) sessionStorage.removeItem(k); } catch { /* nada */ }
    if (id) window.setTimeout(() => { const p = portalDe(main)!; abrir(p, id!); p.querySelector(`.hx__item[data-hx-reg="${CSS.escape(id!)}"]`)?.scrollIntoView({ block: 'center' }); }, 80);
  });
}

export function iniciar(): void {
  document.addEventListener('input', (ev) => { const t = ev.target as HTMLElement; if (!t.closest?.('[data-hx-filtros]')) return; filtrar(t.closest<HTMLElement>('main[data-hx]')!); });
  document.addEventListener('change', (ev) => { const t = ev.target as HTMLElement; if (!t.closest?.('[data-hx-filtros]')) return; filtrar(t.closest<HTMLElement>('main[data-hx]')!); });
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, portal = portalDe(t); if (!portal) return;
    const main = portal.querySelector<HTMLElement>('main[data-hx]')!;
    let b: HTMLElement | null;
    const g = t.closest<HTMLDialogElement>('dialog[data-hx-gaveta]');
    if (g) {
      if (t === g || t.closest('[data-hx-fechar]')) { fechar(g); return; }
      if ((b = t.closest('[data-hx-imprimir]'))) { imprimir(g, b.dataset.hxImprimir!); return; }
      if ((b = t.closest('[data-hx-ir]'))) { try { sessionStorage.setItem(b.dataset.hxChave!, b.dataset.hxValor!); } catch { /* abre só o ecrã */ } g.close(); mostrar(b.dataset.hxIr!); return; }
      return;
    }
    if ((b = t.closest('[data-hx-abrir]'))) { abrir(portal, b.dataset.hxAbrir!, b); return; }
    if ((b = t.closest('[data-hx-vista]'))) { vista(main, b.dataset.hxVista!); return; }
    if ((b = t.closest('[data-hx-ordenar]'))) { ordenar(main, b); return; }
    if ((b = t.closest('[data-hx-tirar]'))) { tirar(main, b.dataset.hxTirar!); main.querySelector<HTMLElement>('[data-hx-procura]')?.focus(); return; }
    if (t.closest('[data-hx-limpar]')) { limpar(main); return; }
    if ((b = t.closest('.hx__mes-botao'))) {
      const aberto = b.getAttribute('aria-expanded') === 'true', lista = document.getElementById(b.getAttribute('aria-controls')!)!;
      b.setAttribute('aria-expanded', String(!aberto)); lista.hidden = aberto; b.closest('.hx__mes')!.classList.toggle('is-fechado', aberto); return;
    }
  });
  document.addEventListener('cancel', (ev) => { const g = ev.target as HTMLElement; if (g.matches?.('dialog[data-hx-gaveta]')) { ev.preventDefault(); fechar(g as HTMLDialogElement); } }, true);
  ['romafe:ecra', 'romafe:versao'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  requestAnimationFrame(armar); window.setTimeout(armar, 300);
  /* no protótipo só se constrói o ecrã visível (comum/pagina.ts): arma quando aparece */
  let pedido = 0; new MutationObserver(() => { if (!pedido) pedido = requestAnimationFrame(() => { pedido = 0; armar(); }); }).observe(document.body, { childList: true, subtree: true });
}
