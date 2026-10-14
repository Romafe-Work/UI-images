/* =========================================================
   GOPARTS — 12 · Pedidos v4: o comportamento (15 out. 2026)
   - ESTADO: Todos / Processado / Sem processamento filtram logo; a risca laranja desliza (240 ms).
   - PESQUISAR: valida as datas (dd/mm/aaaa; a final não antes da inicial) e diz o erro no próprio campo, sem
     apagar o que se escreveu. Enquanto «procura», as linhas de antes ficam à vista, esbatidas, e o rolamento diz
     «A atualizar…»; depois as que saem desvanecem, as que ficam deslizam (FLIP, só transform) e as novas entram.
     Os filtros aplicados ficam em etiquetas com ×. A contagem e o valor no período contam até ao número novo.
   - ORDENAR por Pedido, Data e Valor (↑↓; outro clique inverte).
   - ABRIR NA LINHA: o pedido abre-se por baixo da linha; as linhas de baixo deslizam para o sítio (FLIP), o
     conteúdo entra com 8 px. Na primeira vez, o percurso enche-se até ao passo onde o pedido está e o ícone
     (camião, embalagem, visto) anda até lá. Fechar não tira a página do sítio.
   - PAINEL: «Abrir no painel» mostra o mesmo pedido à direita (ecrã inteiro no telemóvel); o número voa da linha
     para o título (View Transitions, onde o browser as tem). Esc fecha e o foco volta ao botão.
   Nada disto anima a altura; com «reduzir movimento», tudo troca sem deslizar. Não há servidor: a «procura» e
   «Repetir pedido» confirmam ao fim de menos de 1 s.
   ========================================================= */
import { LINHAS, euros } from '../portal/pedidos-dados';
import { detalhe, pedidoDe, linhaDe, valorDe, L, ICONES } from '../portal/pedidos-v4';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import x from 'lucide-static/icons/x.svg?raw';

const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SAIDA = 'cubic-bezier(.22, 1, .36, 1)';
const vivo = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal--ped4:not(.portal--estado) .ped4');
const $ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => Array.from(r.querySelectorAll<T>(s));
let nr = 0;

/* ---------- os critérios ---------- */
interface Criterios { de: string; ate: string; num: string; ref: string }
const criterios = new WeakMap<HTMLElement, Criterios>();
const ler = (main: HTMLElement): Criterios => ({ de: $<HTMLInputElement>(main, '#ped4-de')!.value.trim(), ate: $<HTMLInputElement>(main, '#ped4-ate')!.value.trim(), num: $<HTMLInputElement>(main, '#ped4-num')!.value.trim(), ref: $<HTMLInputElement>(main, '#ped4-ref')!.value.trim() });
const data = (s: string) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s); if (!m) return NaN; const d = new Date(+m[3], +m[2] - 1, +m[1]); return d.getMonth() === +m[2] - 1 ? +`${m[3]}${m[2]}${m[1]}` : NaN; };
const simples = (s: string) => s.toLowerCase().replace(/[\s/.-]/g, '');
function passa(num: string, c: Criterios, estado: string): boolean {
  const l = linhaDe(num), p = pedidoDe(num), d = +l.data.split('/').reverse().join('');
  if (estado !== 'todos' && l.estado !== estado) return false;
  if (c.de && d < data(c.de)) return false;
  if (c.ate && d > data(c.ate)) return false;
  if (c.num && !simples(num).includes(simples(c.num))) return false;
  if (c.ref && !p.artigos.some((a) => simples(a[2]).includes(simples(c.ref)))) return false;
  return true;
}

/** Valida as datas; o erro fica no campo, o que se escreveu também. */
function validar(main: HTMLElement): boolean {
  const erro = (id: string, msg: string) => { const i = $<HTMLInputElement>(main, `#${id}`)!, e = $(main, `#${id}-erro`)!; if (msg) { i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', `${id}-erro`); e.textContent = msg; e.hidden = false; } else { i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); e.hidden = true; } return !msg; };
  const c = ler(main);
  const ok1 = erro('ped4-de', c.de && Number.isNaN(data(c.de)) ? 'Escreva a data como dd/mm/aaaa.' : '');
  const ok2 = erro('ped4-ate', c.ate && Number.isNaN(data(c.ate)) ? 'Escreva a data como dd/mm/aaaa.' : c.de && c.ate && data(c.ate) < data(c.de) ? 'A data final é antes da inicial.' : '');
  if (!ok1 || !ok2) $<HTMLInputElement>(main, '[aria-invalid="true"]')?.focus();
  return ok1 && ok2;
}

/* ---------- os números que contam ---------- */
function contar(el: HTMLElement, para: number, fmt: (n: number) => string): void {
  const de = Number(el.dataset.valor ?? para);
  el.dataset.valor = String(para);
  if (quieto() || de === para) { el.textContent = fmt(para); return; }
  const t0 = performance.now(), dur = 320;
  const passo = (t: number) => { const k = Math.min(1, (t - t0) / dur), e = 1 - (1 - k) ** 3; el.textContent = fmt(de + (para - de) * e); if (k < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}

/* ---------- aplicar os filtros à tabela ---------- */
async function aplicar(main: HTMLElement, animar = true): Promise<void> {
  const c = criterios.get(main) || ler(main);
  const estado = main.dataset.filtro || 'todos';
  const linhas = $$(main, 'tr.ped4__linha');
  const muitas = linhas.length > 40, mexer = animar && !quieto() && !muitas;
  const fica = new Map(linhas.map((tr) => [tr, passa(tr.dataset.num!, c, estado)]));
  const saem = linhas.filter((tr) => !tr.hidden && !fica.get(tr)), entram = linhas.filter((tr) => tr.hidden && fica.get(tr));
  const antes = new Map(linhas.filter((tr) => !tr.hidden).map((tr) => [tr, tr.getBoundingClientRect().top]));
  if (mexer && saem.length) await Promise.all(saem.map((tr) => tr.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-out', fill: 'forwards' }).finished.catch(() => undefined)));
  linhas.forEach((tr) => {
    const sim = fica.get(tr)!; tr.hidden = !sim;
    const det = tr.nextElementSibling as HTMLElement;
    if (!sim && !det.hidden) fechar(main, tr, false);
    tr.getAnimations().forEach((a) => a.cancel());
  });
  if (mexer) {
    linhas.filter((tr) => !tr.hidden && antes.has(tr)).forEach((tr) => { const dy = antes.get(tr)! - tr.getBoundingClientRect().top; if (dy) tr.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 240, easing: SAIDA }); });
    entram.forEach((tr, i) => tr.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: Math.min(i, 6) * 30, easing: SAIDA, fill: 'backwards' }));
  }
  /* as contagens */
  const vis = linhas.filter((tr) => !tr.hidden);
  const conta = $(main, '.ped4__conta b'); if (conta) contar(conta, vis.length, (n) => String(Math.round(n)));
  contar($(main, '[data-kpi="n"]')!, vis.length, (n) => String(Math.round(n)));
  contar($(main, '[data-kpi="total"]')!, vis.reduce((s, tr) => s + Number(tr.dataset.valor), 0), euros);
  $$(main, '.ped4__est').forEach((b) => { const k = b.dataset.filtro!; $(b, '.ped4__est-n')!.textContent = String(LINHAS.filter((l) => passa(l.num, c, k)).length); });
  etiquetas(main, c);
  /* sem resultados: diz porquê e dá a saída */
  const vazio = $(main, '.ped4__vazio')!;
  vazio.hidden = vis.length > 0;
  if (!vis.length) vazio.innerHTML = `<p><strong>Nenhum pedido com estes filtros.</strong> Alargue as datas ou tire um filtro; ${LINHAS.length} pedidos no total.</p><button type="button" class="btn btn--ghost btn--sm" data-limpar-tudo>${ICONES.rotateCcw}<span class="btn__rotulo">Limpar filtros</span></button>`;
}

/** As etiquetas dos filtros aplicados, cada uma com ×. */
function etiquetas(main: HTMLElement, c: Criterios): void {
  const ul = $(main, '.ped4__chips')!;
  const itens: [string, string][] = [];
  if (c.de) itens.push(['de', `Desde ${c.de}`]); if (c.ate) itens.push(['ate', `Até ${c.ate}`]);
  if (c.num) itens.push(['num', `Pedido «${c.num}»`]); if (c.ref) itens.push(['ref', `Referência «${c.ref}»`]);
  const e = main.dataset.filtro || 'todos'; if (e !== 'todos') itens.push(['estado', e === 'proc' ? 'Processado' : 'Sem processamento']);
  ul.innerHTML = itens.map(([k, t]) => `<li><span>${t}</span><button type="button" class="ped4__chip-x" data-tirar="${k}" aria-label="Tirar o filtro ${t}">${L(x)}</button></li>`).join('');
  const n = $(main, '.ped4__filtros-n')!; n.textContent = String(itens.length); n.hidden = !itens.length;
}

/* ---------- pesquisar (com o «a atualizar» por cima das linhas de antes) ---------- */
function pesquisar(main: HTMLElement): void {
  if (!validar(main)) return;
  const b = $<HTMLButtonElement>(main, '.ped4__pesquisar')!; if (b.getAttribute('aria-busy') === 'true') return;
  const antes = b.innerHTML, aviso = $(main, '.ped4__a-atualizar')!, tabela = $(main, '.ped4__tabela')!;
  b.setAttribute('aria-busy', 'true'); b.innerHTML = `${rolamentoSvg('p4-' + ++nr, 'pesquisar', 'ped4__rs')}<span class="btn__rotulo">A pesquisar…</span>`;
  aviso.innerHTML = `${rolamentoSvg('p4-' + ++nr, 'pesquisar', 'ped4__rs')}A atualizar…`; aviso.hidden = false; tabela.classList.add('is-a-atualizar');
  window.setTimeout(() => {
    criterios.set(main, ler(main));
    b.removeAttribute('aria-busy'); b.innerHTML = antes; aviso.hidden = true; tabela.classList.remove('is-a-atualizar');
    aplicar(main);
  }, quieto() ? 120 : 450);
}
function limpar(main: HTMLElement, aplicarJa = true): void {
  $$<HTMLInputElement>(main, '.ped4__input').forEach((i) => { i.value = ''; i.removeAttribute('aria-invalid'); });
  $$(main, '.ped4__erro').forEach((e) => { e.hidden = true; });
  main.dataset.filtro = 'todos'; estados(main);
  criterios.set(main, ler(main));
  if (aplicarJa) aplicar(main);
}

/* ---------- o estado (Todos / Processado / Sem processamento) e a risca ---------- */
function estados(main: HTMLElement): void {
  const f = main.dataset.filtro || 'todos';
  $$(main, '.ped4__est').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtro === f)));
  risca(main);
}
function risca(main: HTMLElement): void {
  const a = $(main, `.ped4__est[aria-pressed="true"]`), r = $(main, '.ped4__est-risca'); if (!a || !r) return;
  r.style.setProperty('--x', `${a.offsetLeft}px`); r.style.setProperty('--w', `${a.offsetWidth}px`);
}

/* ---------- ordenar ---------- */
function ordenar(main: HTMLElement, b: HTMLElement): void {
  const th = b.closest('th')!, k = b.dataset.ordenar!;
  const sobe = th.getAttribute('aria-sort') !== 'ascending';
  $$(main, 'thead th[aria-sort]').forEach((x) => x.setAttribute('aria-sort', 'none'));
  th.setAttribute('aria-sort', sobe ? 'ascending' : 'descending');
  const corpo = $(main, '.ped4__tabela tbody')!, linhas = $$(corpo, 'tr.ped4__linha');
  const antes = new Map(linhas.map((l) => [l, l.getBoundingClientRect().top]));
  const v = (l: HTMLElement) => k === 'num' ? l.dataset.num! : Number(k === 'data' ? l.dataset.data : l.dataset.valor);
  linhas.sort((a, c) => { const x1 = v(a), x2 = v(c); const d = typeof x1 === 'number' ? x1 - (x2 as number) : x1.localeCompare(String(x2), 'pt', { numeric: true }); return sobe ? d : -d; });
  linhas.forEach((l) => corpo.append(l, l.nextElementSibling!));
  if (quieto() || linhas.length > 40) return;
  linhas.forEach((l) => { const dy = antes.get(l)! - l.getBoundingClientRect().top; if (dy && !l.hidden) l.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 240, easing: SAIDA }); });
}

/* ---------- abrir e fechar na linha ---------- */
/** As linhas de baixo deslizam do sítio onde estavam (FLIP): a mudança de altura acontece de uma vez, sem animar a altura. */
function deslizarAbaixo(main: HTMLElement, tr: HTMLElement, mudar: () => void): void {
  const abaixo = $$(main, 'tr.ped4__linha').filter((l) => !l.hidden && (tr.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING));
  const antes = new Map(abaixo.map((l) => [l, l.getBoundingClientRect().top]));
  mudar();
  if (quieto()) return;
  abaixo.forEach((l) => { const dy = antes.get(l)! - l.getBoundingClientRect().top; if (dy) l.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 320, easing: SAIDA }); });
}
function animarPercurso(raiz: HTMLElement): void {
  const tl = $(raiz, '.ped4__tl'); if (!tl || tl.dataset.visto || quieto()) return;
  tl.dataset.visto = '1';
  const p = Number(getComputedStyle(tl).getPropertyValue('--p')) || 0;
  $(tl, '.ped4__tl-cheia')?.animate([{ transform: 'scaleX(0)' }, { transform: `scaleX(${p})` }], { duration: 650, delay: 120, easing: SAIDA, fill: 'backwards' });
  $(tl, '.ped4__tl-mover')?.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${p * 100}%)` }], { duration: 650, delay: 120, easing: SAIDA, fill: 'backwards' });
  $$(tl, '.ped4__tl-passo.is-feito .ped4__tl-ponto').forEach((d, i) => d.animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, delay: 120 + i * (650 / Math.max(1, $$(tl, '.ped4__tl-passo').length - 1)), easing: SAIDA, fill: 'backwards' }));
}
function abrir(main: HTMLElement, tr: HTMLElement): void {
  const det = tr.nextElementSibling as HTMLElement, td = det.firstElementChild as HTMLElement;
  if (!td.firstElementChild) td.innerHTML = detalhe(pedidoDe(tr.dataset.num!), linhaDe(tr.dataset.num!));
  deslizarAbaixo(main, tr, () => { det.hidden = false; tr.classList.add('is-aberto'); $(tr, '.ped4__abrir')!.setAttribute('aria-expanded', 'true'); });
  if (!quieto()) $(td, '.ped4__det')?.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: SAIDA });
  animarPercurso(td);
}
function fechar(main: HTMLElement, tr: HTMLElement, animar = true): void {
  const det = tr.nextElementSibling as HTMLElement;
  const topo = tr.getBoundingClientRect().top;
  const mudar = () => { det.hidden = true; tr.classList.remove('is-aberto'); $(tr, '.ped4__abrir')!.setAttribute('aria-expanded', 'false'); };
  if (animar) deslizarAbaixo(main, tr, mudar); else mudar();
  /* a linha fica onde estava no ecrã */
  if (animar && topo < 0) tr.scrollIntoView({ block: 'start' });
}

/* ---------- o painel à direita ---------- */
/** Com o painel aberto, o resto da página fica inerte (modal): o topo, as abas e a lista. */
function fundo(main: HTMLElement, inerte: boolean): void {
  const portal = main.closest('.portal')!;
  [...$$(portal, ':scope > header, :scope > nav'), ...$$(main, ':scope > header, :scope > section')].forEach((el) => { el.inert = inerte; if (inerte) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden'); });
}
let devolver: HTMLElement | null = null;
function gaveta(main: HTMLElement, num: string, origem: HTMLElement): void {
  const g = $(main, '.ped4__gaveta')!, veu = $(main, '.ped4__veu')!, l = linhaDe(num), p = pedidoDe(num);
  const ref = main.querySelector<HTMLElement>(`tr.ped4__linha[data-num="${num}"] .ped4__ref`);
  devolver = origem;
  const encher = () => {
    g.innerHTML = `<header class="ped4__g-cabeca"><div><p class="ped4__g-rotulo">Pedido</p><h2 class="ped4__g-num" id="ped4-g-num" tabindex="-1">${num}</h2><p class="ped4__g-meta">${l.data} · ${l.armazem} · ${euros(valorDe(p))}</p></div><button type="button" class="ped4__g-fechar" aria-label="Fechar (Esc)">${L(x)}</button></header>${detalhe(p, l, 'gaveta')}`;
    g.hidden = false; veu.hidden = false; main.classList.add('tem-gaveta'); fundo(main, true);
    if (ref) ref.style.viewTransitionName = '';
    $(g, '.ped4__g-num')!.style.viewTransitionName = 'ped4-num';
  };
  const vt = (document as Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } }).startViewTransition;
  if (ref && vt && !quieto()) { ref.style.viewTransitionName = 'ped4-num'; vt.call(document, encher).finished.finally(() => { const t = $(g, '.ped4__g-num'); if (t) t.style.viewTransitionName = ''; }); }
  else { encher(); if (!quieto()) g.animate([{ transform: 'translateX(24px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 340, easing: SAIDA }); }
  window.setTimeout(() => { $(g, '.ped4__g-num')?.focus(); animarPercurso(g); }, quieto() ? 0 : 60);
}
function fecharGaveta(main: HTMLElement): void {
  const g = $(main, '.ped4__gaveta')!; if (g.hidden) return;
  const fim = () => { g.hidden = true; $(main, '.ped4__veu')!.hidden = true; main.classList.remove('tem-gaveta'); fundo(main, false); devolver?.focus(); };
  if (quieto()) { fim(); return; }
  g.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(24px)', opacity: 0 }], { duration: 220, easing: 'ease-in' }).finished.then(fim, fim);
}

/* ---------- repetir o pedido (pendente → confirmado) ---------- */
function repetir(b: HTMLButtonElement): void {
  if (b.getAttribute('aria-busy') === 'true' || b.classList.contains('is-feito')) return;
  const antes = b.innerHTML;
  b.setAttribute('aria-busy', 'true'); b.innerHTML = `${rolamentoSvg('p4-' + ++nr, 'pesquisar', 'ped4__rs')}<span class="btn__rotulo">A adicionar…</span>`;
  window.setTimeout(() => {
    b.removeAttribute('aria-busy'); b.classList.add('is-feito');
    b.innerHTML = `${ICONES.check.replace('<svg', '<svg class="btn__icone"')}<span class="btn__rotulo">Artigos no carrinho</span>`;
    window.setTimeout(() => { b.classList.remove('is-feito'); b.innerHTML = antes; }, 2200);
  }, quieto() ? 150 : 700);
}

/* ---------- ligar ---------- */
function armar(): void {
  const main = vivo(); if (!main) return;
  if (!main.dataset.filtro) main.dataset.filtro = 'todos';
  if (!criterios.has(main)) criterios.set(main, ler(main));
  if (!main.dataset.entrou) { main.dataset.entrou = '1'; if (!quieto()) main.classList.add('ped4--entrar'); window.setTimeout(() => main.classList.remove('ped4--entrar'), 900); }
  $$(main, '[data-kpi]').forEach((d) => { if (!d.dataset.valor) d.dataset.valor = d.dataset.kpi === 'n' ? String(LINHAS.length) : String(LINHAS.reduce((s, l) => s + valorDe(pedidoDe(l.num)), 0)); });
  requestAnimationFrame(() => risca(main));
}

export function iniciar(): void {
  window.addEventListener('click', (ev) => {
    if (editando()) return;
    const main = vivo(); const t = ev.target as Element;
    if (!main || !main.contains(t)) return;
    const est = t.closest<HTMLElement>('.ped4__est');
    if (est) { main.dataset.filtro = est.dataset.filtro; estados(main); aplicar(main); return; }
    if (t.closest('.ped4__limpar, [data-limpar-tudo]')) { limpar(main); return; }
    const tirar = t.closest<HTMLElement>('[data-tirar]');
    if (tirar) { const k = tirar.dataset.tirar!; if (k === 'estado') { main.dataset.filtro = 'todos'; estados(main); } else { const i = $<HTMLInputElement>(main, `#ped4-${k}`)!; i.value = ''; i.removeAttribute('aria-invalid'); $(main, `#ped4-${k}-erro`)!.hidden = true; criterios.set(main, ler(main)); } aplicar(main); return; }
    const o = t.closest<HTMLElement>('[data-ordenar]'); if (o) { ordenar(main, o); return; }
    const ab = t.closest<HTMLElement>('.ped4__filtros-abrir'); if (ab) { const sim = ab.getAttribute('aria-expanded') !== 'true'; ab.setAttribute('aria-expanded', String(sim)); main.classList.toggle('filtros-abertos', sim); return; }
    const rep = t.closest<HTMLButtonElement>('[data-repetir]'); if (rep) { repetir(rep); return; }
    const gv = t.closest<HTMLElement>('[data-gaveta]'); if (gv) { gaveta(main, gv.dataset.gaveta!, gv); return; }
    if (t.closest('.ped4__g-fechar, .ped4__veu')) { fecharGaveta(main); return; }
    if (t.closest('.ped4__linha-det, .ped4__gaveta')) return;
    const tr = t.closest<HTMLElement>('tr.ped4__linha');
    if (tr && !t.closest('a, input')) { if (tr.classList.contains('is-aberto')) fechar(main, tr); else abrir(main, tr); }
  }, true);
  document.addEventListener('submit', (ev) => { const main = vivo(); if (main && (ev.target as Element).closest?.('.ped4__campos')) { ev.preventDefault(); pesquisar(main); } });
  document.addEventListener('keydown', (ev) => {
    const main = vivo(); if (!main || editando()) return;
    if (ev.key === 'Escape' && !$(main, '.ped4__gaveta')!.hidden) { ev.preventDefault(); fecharGaveta(main); }
  });
  document.addEventListener('input', (ev) => { const i = ev.target as HTMLInputElement; if (i.matches?.('.ped4__input[aria-invalid]')) { i.removeAttribute('aria-invalid'); const e = document.getElementById(`${i.id}-erro`); if (e) e.hidden = true; } });
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  window.addEventListener('resize', () => { const m = vivo(); if (m) risca(m); });
}
